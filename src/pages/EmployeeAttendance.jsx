import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import api from '../api/axios';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AuthContext } from '../context/AuthContext';

import { Camera, MapPin, Clock3, LogIn, LogOut, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import './EmployeeAttendance.css';

const indiaDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const EmployeeAttendance = () => {
  const { empName, outletId, outletName, username } = useContext(AuthContext);
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [camera, setCamera] = useState(false);
  const [coords, setCoords] = useState(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const stop = () => { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; setCamera(false); };
  const refresh = useCallback(async () => {
    setBusy(true); setError('');
    try { setRecord(await api.get('/outlet/attendance/selfie', { params: { outletId, date: indiaDate() } })); }
    catch (err) { setError(err.response?.data?.error || 'Unable to load attendance. Please refresh.'); }
    finally { setBusy(false); }
  }, [outletId]);
  useEffect(() => { refresh(); return () => streamRef.current?.getTracks().forEach(track => track.stop()); }, [refresh]);
  useEffect(() => { if (camera && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [camera]);
  const active = record?.attendanceStatus === 'ACTIVE';
  const closed = Boolean(record?.closingAt && record?.date === indiaDate());
  const start = async () => {
    setBusy(true); setError('');
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      setCamera(true);
    } catch (err) { stop(); setError(`Camera and live location are required. ${err.message}`); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    if (!videoRef.current?.videoWidth || !coords) { setError('Wait for the camera to be ready.'); return; }
    setBusy(true); setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const photo = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      // Refresh GPS at capture time rather than reusing an earlier position.
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
      await api.post('/outlet/attendance/selfie', { phone: username, outletId, latitude: position.coords.latitude, longitude: position.coords.longitude, photo, action: active ? 'CLOSING' : 'OPENING', ...(active ? { date: record.date } : {}) });
      stop(); await refresh();
    } catch (err) { stop(); setError(err.response?.data?.error || err.message || 'Unable to save attendance. Refresh and try again.'); }
    finally { setBusy(false); }
  };
  const hours = record?.workedSeconds == null ? '—' : `${Math.floor(record.workedSeconds / 3600)}h ${Math.floor(record.workedSeconds % 3600 / 60)}m`;
  return <section className="employee-attendance">
    <header className="employee-attendance-heading">
      <div><span className="employee-attendance-eyebrow">Your working day</span><h2>Attendance</h2><p>Record your arrival and departure with a selfie and live location.</p></div>
      <Button variant="secondary" onClick={refresh} disabled={busy || camera}><RefreshCw size={16} />Refresh</Button>
    </header>
    <Card className="employee-attendance-card"><CardContent>
      <div className="employee-attendance-identity"><div className="employee-attendance-avatar">{(empName || 'E').slice(0, 1).toUpperCase()}</div><div><h3>{empName || 'Employee'}</h3><p><MapPin size={14} />{outletName || outletId}</p></div><span className={`employee-attendance-status ${active ? 'is-active' : ''}`}><i />{active ? 'Active' : 'Inactive'}</span></div>
      <div className="employee-attendance-date">{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</div>
      {error && <div className="employee-attendance-error" role="alert">{error}</div>}
      <div className="employee-attendance-metrics">
        <div className={`employee-attendance-metric ${record?.checkIn ? 'is-complete' : ''}`}><span className="employee-attendance-metric-icon"><LogIn size={21} /></span><span className="employee-attendance-label">Opening</span><strong>{record?.checkIn || '—'}</strong><small>{record?.checkIn ? `Recorded on ${record.date}` : 'Ready when you arrive'}</small></div>
        <div className={`employee-attendance-metric ${record?.checkOut ? 'is-complete' : ''}`}><span className="employee-attendance-metric-icon"><LogOut size={21} /></span><span className="employee-attendance-label">Closing</span><strong>{record?.checkOut || '—'}</strong><small>{record?.checkOut ? 'Attendance completed' : 'Record before you leave'}</small></div>
        <div className="employee-attendance-metric"><span className="employee-attendance-metric-icon"><Clock3 size={21} /></span><span className="employee-attendance-label">Hours worked</span><strong>{hours}</strong><small>{record?.workedSeconds == null ? 'Calculated after closing' : 'Opening to closing'}</small></div>
      </div>
      {camera ? <div className="employee-attendance-capture"><div className="employee-attendance-camera-title"><Camera size={18} /><h3>{active ? 'Closing selfie' : 'Opening selfie'}</h3></div><p>Keep your face centred and clearly visible.</p><video ref={videoRef} autoPlay playsInline muted /><div className="employee-attendance-capture-actions"><Button onClick={submit} disabled={busy}><Camera size={17} />{busy ? 'Saving attendance…' : `Capture & save ${active ? 'closing' : 'opening'}`}</Button><Button variant="secondary" onClick={stop} disabled={busy}>Cancel</Button></div></div> : <div className="employee-attendance-next"><div><h3>{closed ? 'Your attendance is complete' : active ? 'You’re checked in' : 'Start your working day'}</h3><p>{closed ? 'Both attendance records have been saved.' : active ? 'Record your closing attendance before you leave.' : 'Your opening time is saved when you capture your selfie.'}</p></div><Button onClick={start} disabled={busy || !record || closed}>{closed ? <CheckCircle2 size={18} /> : <Camera size={18} />}{busy ? 'Please wait…' : closed ? 'Completed today' : active ? 'Close attendance' : 'Open attendance'}</Button></div>}
      <div className="employee-attendance-requirements"><span><Camera size={15} />Fresh selfie</span><span><MapPin size={15} />Live location</span><span><ShieldCheck size={15} />Required at opening and closing</span></div>
      {(record?.photoUrl || record?.closingPhotoUrl) && <div className="employee-attendance-evidence"><h3>Today’s selfie records</h3><div>{[['Opening', record.photoUrl, record.checkIn], ['Closing', record.closingPhotoUrl, record.checkOut]].map(([label, url, time]) => url && <figure key={label}><img src={url} alt={`${label} attendance selfie`} /><figcaption><strong>{label}</strong><span>{time}</span></figcaption></figure>)}</div></div>}
    </CardContent></Card>
  </section>;
};
export default EmployeeAttendance;
