import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, CheckCircle2, Clock3, ImageOff, MapPin, UsersRound, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { ErrorState, LoadingState } from '../components/ui/StateContainers';
import { fetchManagerAttendance, fetchOutlets } from '../api/employees';
import { outletLabel } from '../utils/outlets';
import './ManagerAttendance.css';

const today = () => new Date().toISOString().slice(0, 10);

const ManagerAttendance = () => {
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadReport = async (targetOutletId = outletId) => {
    if (!targetOutletId) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchManagerAttendance(targetOutletId, period, date));
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || 'Unable to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchOutlets().then((response) => {
      if (!active) return;
      const list = response?.outlets || [];
      setOutlets(list);
      if (list.length) setOutletId(list[0].outletId || list[0].id);
    }).catch(() => active && setError('Unable to load registered outlets.'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (outletId) loadReport(outletId);
  // Loading follows the selected filter values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId, period, date]);

  const outletOptions = useMemo(() => [
    { value: '', label: outlets.length ? 'Select outlet' : 'No outlets available' },
    ...outlets.map((outlet) => ({
      value: outlet.outletId || outlet.id,
      label: outletLabel(outlet.outletId || outlet.id, outlets),
    })),
  ], [outlets]);

  const summary = report?.summary || {};
  const rangeLabel = report ? (report.period === 'daily' ? report.selectedDate : `${report.startDate} to ${report.endDate}`) : '—';

  return (
    <div className="attendance-page">
      <div className="attendance-page-heading">
        <div>
          <span className="attendance-eyebrow">Workforce operations</span>
          <h2>Attendance review</h2>
          <p>Review employee attendance and verified selfie evidence by outlet.</p>
        </div>
      </div>

      <Card className="attendance-filters-card">
        <CardHeader title="Attendance report filters" action={<span className="attendance-filter-hint">Choose an outlet, period and date</span>} />
        <CardContent>
          <div className="attendance-filters">
            <Select label="Outlet" value={outletId} onChange={(event) => setOutletId(event.target.value)} options={outletOptions} disabled={!outlets.length || loading} />
            <Select label="Report period" value={period} onChange={(event) => setPeriod(event.target.value)} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} disabled={loading} />
            <Input label={period === 'monthly' ? 'Any date in month' : 'Date'} type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={loading} />
            <div className="attendance-filter-action"><Button onClick={() => loadReport()} disabled={loading || !outletId}>{loading ? 'Loading…' : 'Generate report'}</Button></div>
          </div>
        </CardContent>
      </Card>

      {error && <ErrorState error={error} onRetry={() => loadReport()} />}
      {loading && !report ? <LoadingState message="Loading attendance records…" /> : report && (
        <>
          <Card className="attendance-overview-card">
            <CardHeader title={<><span className="attendance-card-kicker">Attendance overview</span>{`${period[0].toUpperCase() + period.slice(1)} attendance — ${rangeLabel}`}</>} action={<span className="attendance-outlet-label">{outletLabel(outletId, outlets)}</span>} />
            <CardContent>
              <div className="attendance-metrics">
                <Metric icon={<UsersRound size={20} />} label="Employees" value={summary.employeeCount || 0} />
                <Metric icon={<CalendarDays size={20} />} label="Attendance records" value={summary.attendanceRecords || 0} />
                <Metric icon={<CheckCircle2 size={20} />} label="Present records" value={summary.presentRecords || 0} tone="#10b981" />
                <Metric icon={<XCircle size={20} />} label="Absent records" value={summary.absentRecords || 0} tone="#ef4444" />
              </div>
            </CardContent>
          </Card>

          <Card className="attendance-table-card">
            <CardHeader title="Employee summary" />
            <CardContent className="attendance-table-wrap">
              <table className="attendance-table attendance-summary-table">
                <thead><tr><th>Employee</th><th>Role</th><th>Work type</th><th>Present</th><th>Absent</th><th>Recorded days</th></tr></thead>
                <tbody>{report.employees?.length ? report.employees.map((employee) => <tr key={employee.empId}><td className="attendance-employee-name">{employee.employeeName}</td><td>{employee.role || '—'}</td><td><span className="attendance-work-type">{employee.workType || 'OFFICE'}</span></td><td className="attendance-positive-value">{employee.presentDays}</td><td className="attendance-negative-value">{employee.absentDays}</td><td>{employee.records}</td></tr>) : <tr><td colSpan="6" className="attendance-empty-cell">No employees found for this outlet.</td></tr>}</tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="attendance-table-card">
            <CardHeader title="Attendance records and selfie evidence" action={<span className="text-muted">{report.attendance?.length || 0} record(s)</span>} />
            <CardContent className="attendance-table-wrap">
              <table className="attendance-table attendance-records-table">
                <thead><tr><th>Date</th><th>Employee</th><th>Status</th><th>Check-in</th><th>Mode</th><th>Distance</th><th>Selfie</th></tr></thead>
                <tbody>{report.attendance?.length ? report.attendance.map((record, index) => <tr key={`${record.empId}-${record.date}-${index}`}><td className="attendance-date-cell">{record.date}</td><td><strong>{record.employeeName}</strong><span className="attendance-role">{record.role || record.workType}</span></td><td><span className={`attendance-status ${record.present ? 'is-present' : 'is-absent'}`}>{record.present ? 'Present' : 'Absent'}</span></td><td>{record.checkIn || '—'}</td><td>{record.attendanceMode === 'FIELD_SELFIE' ? 'Field selfie' : record.attendanceMode === 'OFFICE_GEOFENCE' ? 'Office geo-fence' : '—'}</td><td>{record.distance === null || record.distance === undefined ? '—' : `${record.distance} m`}</td><td>{record.photoUrl ? <Button variant="secondary" className="attendance-selfie-button" onClick={() => setSelectedRecord(record)}><Camera size={15} /> View selfie</Button> : record.hasSelfie ? <span className="attendance-selfie-unavailable"><ImageOff size={15} /> Link unavailable</span> : <span className="text-muted">No selfie</span>}</td></tr>) : <tr><td colSpan="7" className="attendance-empty-cell">No attendance records in this period.</td></tr>}</tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {selectedRecord && <div className="attendance-selfie-modal" role="dialog" aria-modal="true" onClick={() => setSelectedRecord(null)}><Card className="attendance-selfie-dialog" onClick={(event) => event.stopPropagation()}><CardHeader title={`Selfie — ${selectedRecord.employeeName}`} action={<Button variant="secondary" onClick={() => setSelectedRecord(null)}>Close</Button>} /><CardContent><img src={selectedRecord.photoUrl} alt={`Attendance selfie uploaded by ${selectedRecord.employeeName}`} /><div className="attendance-selfie-meta"><span><Clock3 size={15} /> {selectedRecord.date} {selectedRecord.checkIn || ''}</span><span><MapPin size={15} /> {selectedRecord.distance === null || selectedRecord.distance === undefined ? 'Field attendance' : `${selectedRecord.distance} metres from outlet`}</span></div></CardContent></Card></div>}
    </div>
  );
};

const Metric = ({ icon, label, value, tone }) => <div className="attendance-metric" style={{ '--attendance-metric-tone': tone || 'var(--color-primary)' }}><div className="attendance-metric-label">{icon}<span>{label}</span></div><strong>{value}</strong></div>;

export default ManagerAttendance;
