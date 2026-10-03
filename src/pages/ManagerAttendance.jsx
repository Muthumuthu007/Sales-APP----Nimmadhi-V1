import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, CheckCircle2, Clock3, ImageOff, MapPin, UsersRound, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { ErrorState, LoadingState } from '../components/ui/StateContainers';
import { fetchManagerAttendance, fetchOutlets } from '../api/employees';
import { outletLabel } from '../utils/outlets';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Attendance</h2>
          <p className="text-muted" style={{ margin: '0.4rem 0 0' }}>Review employee attendance and verified selfie evidence by outlet.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '260px' }}><Select label="Outlet" value={outletId} onChange={(event) => setOutletId(event.target.value)} options={outletOptions} disabled={!outlets.length || loading} /></div>
          <div style={{ minWidth: '145px' }}><Select label="Report period" value={period} onChange={(event) => setPeriod(event.target.value)} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} disabled={loading} /></div>
          <div style={{ minWidth: '160px' }}><Input label={period === 'monthly' ? 'Any date in month' : 'Date'} type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={loading} /></div>
          <Button onClick={() => loadReport()} disabled={loading || !outletId}>{loading ? 'Loading…' : 'Generate'}</Button>
        </div>
      </div>

      {error && <ErrorState error={error} onRetry={() => loadReport()} />}
      {loading && !report ? <LoadingState message="Loading attendance records…" /> : report && (
        <>
          <Card>
            <CardHeader title={`${period[0].toUpperCase() + period.slice(1)} attendance — ${rangeLabel}`} action={<span className="text-muted">{outletLabel(outletId, outlets)}</span>} />
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <Metric icon={<UsersRound size={20} />} label="Employees" value={summary.employeeCount || 0} />
                <Metric icon={<CalendarDays size={20} />} label="Attendance records" value={summary.attendanceRecords || 0} />
                <Metric icon={<CheckCircle2 size={20} />} label="Present records" value={summary.presentRecords || 0} tone="#10b981" />
                <Metric icon={<XCircle size={20} />} label="Absent records" value={summary.absentRecords || 0} tone="#ef4444" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Employee summary" />
            <CardContent style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: '720px' }}>
                <thead><tr><th>Employee</th><th>Role</th><th>Work type</th><th>Present</th><th>Absent</th><th>Recorded days</th></tr></thead>
                <tbody>{report.employees?.length ? report.employees.map((employee) => <tr key={employee.empId}><td>{employee.employeeName}</td><td>{employee.role || '—'}</td><td>{employee.workType || 'OFFICE'}</td><td>{employee.presentDays}</td><td>{employee.absentDays}</td><td>{employee.records}</td></tr>) : <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No employees found for this outlet.</td></tr>}</tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Attendance records and selfie evidence" action={<span className="text-muted">{report.attendance?.length || 0} record(s)</span>} />
            <CardContent style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: '1040px' }}>
                <thead><tr><th>Date</th><th>Employee</th><th>Status</th><th>Check-in</th><th>Mode</th><th>Distance</th><th>Selfie</th></tr></thead>
                <tbody>{report.attendance?.length ? report.attendance.map((record, index) => <tr key={`${record.empId}-${record.date}-${index}`}><td>{record.date}</td><td><strong>{record.employeeName}</strong><br /><span className="text-muted">{record.role || record.workType}</span></td><td style={{ color: record.present ? '#10b981' : '#ef4444', fontWeight: 700 }}>{record.present ? 'PRESENT' : 'ABSENT'}</td><td>{record.checkIn || '—'}</td><td>{record.attendanceMode === 'FIELD_SELFIE' ? 'Field selfie' : record.attendanceMode === 'OFFICE_GEOFENCE' ? 'Office geo-fence' : '—'}</td><td>{record.distance === null || record.distance === undefined ? '—' : `${record.distance} m`}</td><td>{record.photoUrl ? <Button variant="secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => setSelectedRecord(record)}><Camera size={15} /> View selfie</Button> : record.hasSelfie ? <span className="text-muted"><ImageOff size={15} /> Link unavailable</span> : 'No selfie'}</td></tr>) : <tr><td colSpan="7" className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No attendance records in this period.</td></tr>}</tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {selectedRecord && <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, .72)', display: 'grid', placeItems: 'center', padding: '1.5rem', zIndex: 1000 }} onClick={() => setSelectedRecord(null)}><Card style={{ width: 'min(460px, 100%)' }} onClick={(event) => event.stopPropagation()}><CardHeader title={`Selfie — ${selectedRecord.employeeName}`} action={<Button variant="secondary" onClick={() => setSelectedRecord(null)}>Close</Button>} /><CardContent><img src={selectedRecord.photoUrl} alt={`Attendance selfie uploaded by ${selectedRecord.employeeName}`} style={{ display: 'block', width: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '0.75rem', background: '#111827' }} /><div style={{ marginTop: '1rem', display: 'grid', gap: '0.4rem' }}><span><Clock3 size={15} /> {selectedRecord.date} {selectedRecord.checkIn || ''}</span><span><MapPin size={15} /> {selectedRecord.distance === null || selectedRecord.distance === undefined ? 'Field attendance' : `${selectedRecord.distance} metres from outlet`}</span></div></CardContent></Card></div>}
    </div>
  );
};

const Metric = ({ icon, label, value, tone }) => <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '0.75rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: tone || 'var(--color-primary)' }}>{icon}<span className="text-muted">{label}</span></div><strong style={{ display: 'block', fontSize: '1.6rem', marginTop: '0.45rem', color: tone }}>{value}</strong></div>;

export default ManagerAttendance;
