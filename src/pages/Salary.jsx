import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { fetchEmployeesWithSalary } from '../api/employees';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';

const Salary = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [outletId, setOutletId] = useState('OUT009');
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);

  const loadEmployees = async (targetId = outletId) => {
    if (!targetId.trim()) {
      setEmployeesError('Please enter a valid Outlet ID.');
      return;
    }
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const response = await fetchEmployeesWithSalary(targetId.trim());
      const list = Array.isArray(response) ? response : (response?.employees || response?.data || []);
      setEmployeesList(list);
    } catch (err) {
      setEmployeesError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to fetch employee salaries.');
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees('OUT009');
  }, []);

  const viewPayslip = (emp) => {
    setSelectedUser(emp);
    setModalOpen(true);
  };

  const presentDays = 22;
  const otHours = 10;

  const salaryData = employeesList.map(emp => {
    const isMonthly = emp.salaryModel === 'MONTHLY';
    const baseRate = isMonthly ? (emp.basicSalary || 0) : (emp.perDayRate || 0);
    const base = isMonthly ? baseRate : baseRate * presentDays;
    const ot = otHours * (emp.overtimeRate || 0);
    const allowances = emp.allowancesDefault !== undefined && emp.allowancesDefault !== null ? emp.allowancesDefault : 100;
    const deductions = emp.deductionsDefault !== undefined && emp.deductionsDefault !== null ? emp.deductionsDefault : 50;
    const netSalary = base + ot + allowances - deductions;

    return {
      ...emp,
      presentDays,
      otHours,
      baseSalary: base,
      otPay: ot,
      allowances,
      deductions,
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
    { key: 'presentDays', label: 'Present Days', align: 'center' },
    { key: 'otHours', label: 'OT Hours', align: 'center' },
    { key: 'netSalary', label: 'Net Salary', align: 'right', render: (row) => `₹${Number(row.netSalary || 0).toLocaleString()}` },
    { key: 'actions', label: 'Actions', align: 'center', render: (row) => (
      <Button variant="secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => viewPayslip(row)}>View Payslip</Button>
    )}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Salary Generation</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: '160px' }}>
            <Input 
              label="Outlet ID" 
              placeholder="e.g. OUT009" 
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
            />
          </div>
          <div style={{ width: '160px' }}>
            <Select 
              label="Select Month"
              options={[{ label: 'April 2026', value: '04-2026' }, { label: 'March 2026', value: '03-2026' }]} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%', justifyContent: 'flex-end', paddingTop: '1.25rem' }}>
            <Button onClick={() => loadEmployees(outletId)} disabled={employeesLoading}>
              {employeesLoading ? 'Loading...' : 'Generate'}
            </Button>
          </div>
        </div>
      </div>

      {employeesError && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
          {employeesError}
        </div>
      )}

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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Payslip Details">
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
              <span className="text-muted">Base Salary:</span>
              <span>
                {selectedUser.salaryModel === 'MONTHLY' 
                  ? `₹${Number(selectedUser.basicSalary || 0).toLocaleString()}` 
                  : `${selectedUser.presentDays} days × ₹${Number(selectedUser.perDayRate || 0).toLocaleString()} = ₹${Number(selectedUser.baseSalary || 0).toLocaleString()}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Overtime:</span>
              <span>{selectedUser.otHours} hrs × ₹{Number(selectedUser.overtimeRate || 0).toLocaleString()} = ₹{Number(selectedUser.otPay || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Allowances:</span>
              <span>₹{Number(selectedUser.allowances || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Deductions:</span>
              <span>-₹{Number(selectedUser.deductions || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem', fontSize: '1.125rem' }}>
              <strong style={{ color: 'var(--color-primary)' }}>Net Total:</strong>
              <strong>₹{Number(selectedUser.netSalary || 0).toLocaleString()}</strong>
            </div>
            <Button style={{ marginTop: '1rem' }} onClick={() => setModalOpen(false)}>Print / Download PDF</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Salary;

