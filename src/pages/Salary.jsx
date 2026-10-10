import { salaryReportCsv } from '../utils/salaryReport';
import { attendanceSalary, salaryCalendar, travelAllowancePay, netSalaryPay } from '../utils/salaryEligibility';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { fetchEmployeesWithSalary, fetchOutletIncentives, fetchOutlets, fetchEmployeeAdvances, recordEmployeeAdvance } from '../api/employees';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';

const Salary = () => {
  const [advanceUser, setAdvanceUser] = useState(null);
  const [advanceForm, setAdvanceForm] = useState({kind: 'ADVANCE', amount: '', month: '', note: '', employeeConfirmed: false, entryId: ''});
  const [advanceError, setAdvanceError] = useState('');
  const [advanceSaving, setAdvanceSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [outletId, setOutletId] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [month, setMonth] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7));
  const [incentiveReport, setIncentiveReport] = useState(null);

  const loadEmployees = useCallback(async (targetId = outletId) => {
    if (!targetId || !month) {
      setEmployeesError('Select an outlet and salary month first.');
      return;
    }
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const [employeeResponse, incentiveResponse] = await Promise.all([
        fetchEmployeesWithSalary(targetId),
        fetchOutletIncentives(targetId, month),
      ]);
      const response = employeeResponse;
      const list = Array.isArray(response) ? response : (response?.employees || response?.data || []);
      const withAdvances = await Promise.all(list.map(async employee => ({...employee, advances: await fetchEmployeeAdvances(employee.empId, targetId, month)})));
      setEmployeesList(withAdvances);
      setIncentiveReport(incentiveResponse || null);
    } catch (err) {
      setEmployeesList([]);
      setIncentiveReport(null);
      setEmployeesError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to fetch employee salaries.');
    } finally {
      setEmployeesLoading(false);
    }
  }, [outletId, month]);

  useEffect(() => {
    let isMounted = true;
    fetchOutlets().then((response) => {
      if (!isMounted) return;
      const availableOutlets = response?.outlets || [];
      setOutlets(availableOutlets);
      if (availableOutlets.length) setOutletId(availableOutlets[0].outletId || availableOutlets[0].id);
    }).catch(() => {
      if (isMounted) setEmployeesError('Unable to load registered outlets.');
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (outletId) loadEmployees(outletId);
  }, [outletId, loadEmployees]);

  const viewPayslip = (emp) => {
    setSelectedUser(emp);
    setModalOpen(true);
  };

  const incentiveByEmployee = Object.fromEntries(
    (incentiveReport?.employees || []).map((employee) => [employee.empId, employee])
  );

  const calendar = month ? salaryCalendar(month) : { sundays: 0 };
  const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const salaryData = employeesList.map(emp => {
    // The backend returns remuneration under `salary`; keep compatibility
    // with earlier flat records as well.
    const salary = emp.salary || emp;
    const isMonthly = salary.salaryModel === 'MONTHLY';
    const baseRate = isMonthly ? (salary.basicSalary || 0) : (salary.perDayRate || 0);
    const incentive = incentiveByEmployee[emp.empId] || {};
    const presentDays = incentive.presentDays || 0;
    const otHours = 0;
    const calculation = isMonthly ? attendanceSalary(baseRate, 26, presentDays, calendar.sundays) : { dailyRate: baseRate, attendancePay: baseRate * presentDays, sundayPay: 0, paidSundays: 0, absentDays: 0, baseSalary: baseRate * presentDays };
    const base = calculation.baseSalary;
    const travelPay = travelAllowancePay(salary.monthlyTravelAllowance || 0, presentDays);
    const ot = otHours * (salary.overtimeRate || 0);
    const allowances = salary.allowancesDefault !== undefined && salary.allowancesDefault !== null ? salary.allowancesDefault : 0;
    const deductions = salary.deductionsDefault !== undefined && salary.deductionsDefault !== null ? salary.deductionsDefault : 0;
    const salesIncentive = incentive.salesIncentive || 0;
    const esiPfDeduction = Number(salary.monthlyEsiPfAmount || 0);
    const advanceRecovery = Number(emp.advances?.advanceRecovery || 0);
    const netSalary = netSalaryPay({ base, travelPay, ot, allowances, salesIncentive, deductions, esiPfDeduction, advanceRecovery });

    return {
      ...emp,
      ...salary,
      ...calculation,
      ...emp.advances,
      advanceRecovery,
      salaryMonth: month,
      monthSundays: calendar.sundays,
      presentDays,
      otHours,
      baseSalary: base,
      otPay: ot,
      travelPay,
      allowances,
      deductions,
      esiPfDeduction,
      salesIncentive,
      netSalary
    };
  });

  const columns = [
    { key: 'name', label: 'Employee', render: (row) => row.name || row.employeeName || row.empName || 'Unnamed' },
    { key: 'designation', label: 'Designation', render: (row) => row.designation || row.role || '-' },
    { key: 'salaryModel', label: 'Salary Model', render: (row) => row.salaryModel === 'MONTHLY' ? 'Monthly' : 'Daily / Per Day' },
    {
      key: 'baseRate',
      label: 'Base Rate',
      align: 'right',
      render: (row) => row.salaryModel === 'MONTHLY'
        ? `₹${Number(row.basicSalary || 0).toLocaleString()}`
        : `₹${Number(row.perDayRate || 0).toLocaleString()} / day`
    },
    { key: 'presentDays', label: 'Attendance Days', align: 'center' },
    { key: 'absentDays', label: 'Absent Days', align: 'center', render: row => row.salaryModel === 'MONTHLY' ? row.absentDays : '—' },
    { key: 'dailyRate', label: 'Daily Rate', align: 'right', render: row => money(row.dailyRate) },
    { key: 'paidSundays', label: 'Paid Sundays', align: 'center', render: row => row.salaryModel === 'MONTHLY' ? `${row.paidSundays} / ${row.monthSundays}` : '—' },
    { key: 'travelPay', label: 'Travel Pay', align: 'right', render: row => money(row.travelPay) },
    { key: 'sundayPay', label: 'Sunday Pay', align: 'right', render: row => money(row.sundayPay) },
    { key: 'baseSalary', label: 'Attendance + Sunday Pay', align: 'right', render: row => money(row.baseSalary) },
    { key: 'salesIncentive', label: 'Sales Incentive', align: 'right', render: (row) => `₹${Number(row.salesIncentive || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { key: 'otHours', label: 'OT Hours', align: 'center' },
    { key: 'esiPfDeduction', label: 'ESI & PF', align: 'right', render: row => money(row.esiPfDeduction) },
    { key: 'previousAdvance', label: 'Previous Advance', align: 'right', render: row => money(row.previousAdvance) },
    { key: 'advanceBalance', label: 'Balance After Month', align: 'right', render: row => money(row.advanceBalance) },
    { key: 'advanceReceived', label: 'Advance Received', align: 'right', render: row => money(row.advanceReceived) },
    { key: 'advanceRecovery', label: 'Advance Recovery', align: 'right', render: row => money(row.advanceRecovery) },
    { key: 'outstandingAdvance', label: 'Advance Outstanding', align: 'right', render: row => money(row.outstandingAdvance) },
    { key: 'netSalary', label: 'Net Salary', align: 'right', render: (row) => money(row.netSalary) },
    { key: 'actions', label: 'Actions', align: 'center', render: (row) => (
      <><Button variant="secondary" onClick={() => { setAdvanceUser(row); setAdvanceError(''); setAdvanceForm({kind:'ADVANCE',amount:'',month,note:'',employeeConfirmed:false,entryId:crypto.randomUUID()}); }}>Advances / Recovery</Button><Button variant="secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => viewPayslip(row)}>View Payslip</Button></>
    )}
  ];

  const saveAdvance = async () => {
    setAdvanceSaving(true); setAdvanceError('');
    try {
      await recordEmployeeAdvance(advanceUser.empId, {...advanceForm, outletId});
      setAdvanceUser(null);
      await loadEmployees(outletId);
    } catch (error) {
      setAdvanceError(error.response?.data?.error || (error.response?.data ? JSON.stringify(error.response.data) : error.message) || 'Unable to save advance entry.');
    } finally { setAdvanceSaving(false); }
  };

  const downloadReport = () => {
    const outlet = outlets.find(item => (item.outletId || item.id) === outletId);
    const csv = salaryReportCsv(salaryData, month, outlet?.outletName || outlet?.name || outletId);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary-report-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const outletOptions = [
    { value: '', label: outlets.length ? 'Select outlet' : 'No outlets available' },
    ...outlets.map((outlet) => ({
      value: outlet.outletId || outlet.id,
      label: `${outlet.outletName || outlet.name || outlet.username || 'Outlet'} (${outlet.outletId || outlet.id})`,
    })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Salary Generation</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '260px' }}>
            <Select
              label="Outlet"
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              options={outletOptions}
              disabled={!outlets.length || employeesLoading}
            />
          </div>
          <div style={{ width: '160px' }}>
            <Input label="Salary month" type="month" disabled={employeesLoading} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%', justifyContent: 'flex-end', paddingTop: '1.25rem' }}>
            <Button onClick={() => loadEmployees(outletId)} disabled={employeesLoading || !outletId}>
              {employeesLoading ? 'Loading...' : 'Generate'}
            </Button>
            <Button variant="secondary" onClick={downloadReport} disabled={employeesLoading || Boolean(employeesError) || !salaryData.length}>Download Salary Report</Button>
          </div>
        </div>
      </div>

      {employeesError && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
          {employeesError}
        </div>
      )}

      <Card><CardContent><strong>Attendance-based salary · fixed 26 working days</strong><p style={{ marginBottom: 0 }}>Monthly salary ÷ 26 × (attendance days + eligible Sundays). Each absent working day reduces pay. Sunday eligibility: 24+ days → all; 20–23 → minus 1; 15–19 → minus 2; 10–14 → minus 3; below 10 → none. {month}: {calendar.sundays} Sundays. Amounts are rounded after calculation.</p></CardContent></Card>
      <Card>
        <CardHeader title="Monthly Sales Incentive" />
        <CardContent>
          {incentiveReport ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div><div className="text-muted">Sales incentive pool</div><strong>₹{Number(incentiveReport.sales?.incentivePool || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                <div><div className="text-muted">Eligible present days</div><strong>{incentiveReport.attendance?.eligiblePresentDays || 0}</strong></div>
                <div><div className="text-muted">Matched product quantity</div><strong>{incentiveReport.sales?.matchedQuantity || 0}</strong></div>
                <div><div className="text-muted">Unmatched product quantity</div><strong>{incentiveReport.sales?.unmatchedQuantity || 0}</strong></div>
              </div>
              {incentiveReport.sales?.unmatchedProducts?.length > 0 && (
                <p style={{ margin: '1rem 0 0', color: 'var(--color-warning, #f59e0b)' }}>
                  {incentiveReport.sales.unmatchedProducts.length} product type(s) did not match the configured PDF rate card and were excluded from the pool.
                </p>
              )}
            </>
          ) : <span className="text-muted">Choose an outlet and month, then generate the report.</span>}
        </CardContent>
      </Card>

      <Card>
        <CardContent style={{ padding: 0 }}>
          {employeesLoading ? (
            <div style={{ padding: '3rem 0' }}>
              <LoadingState message="Fetching employee salaries..." />
            </div>
          ) : (
            <Table columns={columns} data={salaryData} emptyStateMessage="No employee salary configurations found for this outlet." />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={Boolean(advanceUser)} onClose={() => { if (!advanceSaving) setAdvanceUser(null); }} title={`Advances · ${advanceUser?.name || ''}`}>
        {advanceUser && <div style={{display:'grid',gap:'1rem'}}>
          <strong>Outstanding advance: {money(advanceUser.outstandingAdvance)}</strong>
          <Select label="Entry type" value={advanceForm.kind} options={[{value:'ADVANCE',label:'Advance received'},{value:'RECOVERY',label:'Recover from salary'}]} onChange={e => setAdvanceForm({...advanceForm,kind:e.target.value})} disabled={advanceSaving} />
          <Input label="Salary month" type="month" value={advanceForm.month} onChange={e => setAdvanceForm({...advanceForm,month:e.target.value})} disabled={advanceSaving} />
          <Input label="Amount (₹)" type="number" min="0.01" step="0.01" value={advanceForm.amount} onChange={e => setAdvanceForm({...advanceForm,amount:e.target.value})} disabled={advanceSaving} />
          <Input label="Note" value={advanceForm.note} onChange={e => setAdvanceForm({...advanceForm,note:e.target.value})} disabled={advanceSaving} />
          {advanceForm.kind === 'RECOVERY' && <label><input type="checkbox" checked={advanceForm.employeeConfirmed} onChange={e => setAdvanceForm({...advanceForm,employeeConfirmed:e.target.checked})} disabled={advanceSaving} /> Employee agreed to this salary deduction</label>}
          {advanceError && <p role="alert">{advanceError}</p>}
          <Button onClick={saveAdvance} disabled={advanceSaving || !advanceForm.amount || !advanceForm.month || (advanceForm.kind === 'RECOVERY' && !advanceForm.employeeConfirmed)}>{advanceSaving ? 'Saving…' : 'Record entry'}</Button>
          <h4>Advance and recovery history</h4>
          {(advanceUser.entries || []).length === 0 && <p>No advances recorded.</p>}
          {(advanceUser.entries || []).map(entry => <div key={entry.entryId}><strong>{entry.month}</strong> · {money(entry.amount)} {entry.kind === 'RECOVERY' ? 'deducted from salary' : 'advance received'}{entry.note && ` · ${entry.note}`}</div>)}
        </div>}
      </Modal>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Payslip · ${selectedUser?.salaryMonth || month}`}>
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Employee:</span>
              <span className="font-semibold">{selectedUser.name || selectedUser.employeeName || selectedUser.empName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Salary Model:</span>
              <span className="font-semibold">{selectedUser.salaryModel === 'MONTHLY' ? 'Monthly' : 'Daily / Per Day'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Attendance pay:</span>
              <span>
                {selectedUser.salaryModel === 'MONTHLY'
                  ? `${selectedUser.presentDays} days × (${money(selectedUser.basicSalary)} ÷ 26) = ${money(selectedUser.attendancePay)}`
                  : `${selectedUser.presentDays} days × ₹${Number(selectedUser.perDayRate || 0).toLocaleString()} = ₹${Number(selectedUser.baseSalary || 0).toLocaleString()}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Eligible Sunday pay:</span>
              <span>{selectedUser.paidSundays} of {selectedUser.monthSundays} Sundays · {money(selectedUser.sundayPay)}</span>
            </div>
            {selectedUser.salaryModel === 'MONTHLY' && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Absent working days:</span><span>{selectedUser.absentDays} · {money(selectedUser.absenceDeduction)} deducted from attendance pay</span></div>}
            {Boolean(selectedUser.roundingAdjustment) && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Rounding adjustment:</span><span>{selectedUser.roundingAdjustment < 0 ? '−' : '+'}{money(Math.abs(selectedUser.roundingAdjustment))}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Attendance + Sunday pay:</span><strong>{money(selectedUser.baseSalary)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Overtime:</span>
              <span>{selectedUser.otHours} hrs × ₹{Number(selectedUser.overtimeRate || 0).toLocaleString()} = ₹{Number(selectedUser.otPay || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Sales incentive:</span>
              <span>₹{Number(selectedUser.salesIncentive || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Travel allowance:</span>
              <span>{money(selectedUser.monthlyTravelAllowance)} ÷ 26 × {selectedUser.presentDays} days = {money(selectedUser.travelPay)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Allowances:</span>
              <span>₹{Number(selectedUser.allowances || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Other deductions:</span>
              <span>-₹{Number(selectedUser.deductions || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">ESI &amp; PF (fixed monthly deduction):</span>
              <span>-{money(selectedUser.esiPfDeduction)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Advance recovered from {selectedUser.salaryMonth} salary:</span><span>−{money(selectedUser.advanceRecovery)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Advance balance after this month:</span><span>{money(selectedUser.advanceBalance)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem', fontSize: '1.125rem' }}>
              <strong style={{ color: 'var(--color-primary)' }}>Net Total:</strong>
              <strong>{money(selectedUser.netSalary)}</strong>
            </div>
            <Button style={{ marginTop: '1rem' }} onClick={() => setModalOpen(false)}>Print / Download PDF</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Salary;
