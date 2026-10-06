import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../api/axios';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AuthContext } from '../context/AuthContext';

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
  const refresh = async () => {
    setBusy(true); setError('');
    try { setRecord(await api.get('/outlet/attendance/selfie', { params: { outletId, date: indiaDate() } })); }
    catch (err) { setError(err.response?.data?.error || 'Unable to load attendance. Please refresh.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { refresh(); return () => streamRef.current?.getTracks().forEach(track => track.stop()); }, [outletId]);
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
  return <div style={{ maxWidth: 650, margin: '0 auto', padding: '1rem' }}><Card>
    <CardHeader title="Opening and closing attendance" action={<Button variant="secondary" onClick={refresh} disabled={busy || camera}>Refresh</Button>} />
    <CardContent>
      <p>{empName} · {outletName || outletId}</p>
      <p>Capture a fresh selfie and live location when opening and when closing attendance.</p>
      {error && <p role="alert" style={{ color: 'var(--color-red)' }}>{error}</p>}
      {record && <div><p>Status: <strong>{active ? 'Active' : 'Inactive'}</strong></p><p>Opening: {record.checkIn ? `${record.date} ${record.checkIn}` : 'Not recorded'}</p><p>Closing: {record.checkOut || 'Not recorded'}</p><p>Hours worked: {record.workedSeconds == null ? 'Available after closing' : `${Math.floor(record.workedSeconds / 3600)}h ${Math.floor(record.workedSeconds % 3600 / 60)}m`}</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>{[['Opening selfie', record.photoUrl], ['Closing selfie', record.closingPhotoUrl]].map(([label, url]) => url && <figure key={label} style={{ margin: 0 }}><img src={url} alt={label} style={{ width: 150, borderRadius: 8 }} /><figcaption>{label}</figcaption></figure>)}</div>
      </div>}
      {camera ? <div><video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 12, marginTop: 16 }} /><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : `Capture selfie & save ${active ? 'closing' : 'opening'}`}</Button><Button variant="secondary" onClick={stop} disabled={busy}>Cancel</Button></div> : <Button onClick={start} disabled={busy || !record || closed}>{busy ? 'Loading…' : closed ? 'Attendance completed today' : active ? 'Close attendance — selfie & location' : 'Open attendance — selfie & location'}</Button>}
    </CardContent>
  </Card></div>;
};
export default EmployeeAttendance;
