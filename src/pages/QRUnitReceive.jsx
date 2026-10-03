import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, PackageCheck, QrCode, ScanLine, X } from 'lucide-react';
import api from '../api/axios';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const createKey = () => {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `receive-unit-${random}`;
};

// Factory labels encode a small JSON payload so the QR can be extended later
// without changing the printed format. The receipt API needs the raw unit ID.
const unitIdFromScan = (value) => {
  const scanned = String(value || '').trim();
  if (!scanned) return '';
  try {
    const payload = JSON.parse(scanned);
    return typeof payload?.unit_id === 'string' && payload.unit_id.trim()
      ? payload.unit_id.trim()
      : scanned;
  } catch {
    return scanned;
  }
};

/**
 * Physical-unit receipt. Most QR scanners type the encoded unit ID and submit
 * Enter, so this works with both dedicated scanners and a mobile camera app.
 */
export default function QRUnitReceive() {
  const [unitId, setUnitId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const keys = useRef(new Map());
  const scanner = useRef(null);

  const stopCamera = async () => {
    const activeScanner = scanner.current;
    scanner.current = null;
    if (activeScanner?.isScanning) {
      try { await activeScanner.stop(); } catch { /* Camera can already be stopped by the browser. */ }
    }
    activeScanner?.clear?.();
    setCameraOpen(false);
  };

  useEffect(() => {
    if (!cameraOpen) return undefined;
    let cancelled = false;
    const startCamera = async () => {
      try {
        const instance = new Html5Qrcode('qr-unit-camera');
        scanner.current = instance;
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (cancelled) return;
            setUnitId(unitIdFromScan(decodedText));
            setCameraError(null);
            await stopCamera();
          },
          () => {},
        );
      } catch (cameraFailure) {
        if (!cancelled) {
          setCameraError(cameraFailure?.message || 'Unable to open the camera. Allow camera access, then try again.');
          setCameraOpen(false);
        }
      }
    };
    startCamera();
    return () => {
      cancelled = true;
      const activeScanner = scanner.current;
      scanner.current = null;
      if (activeScanner?.isScanning) activeScanner.stop().catch(() => {});
    };
  }, [cameraOpen]);

  const receive = async (event) => {
    event?.preventDefault();
    const value = unitIdFromScan(unitId);
    if (!value) {
      setError('Scan or enter the QR unit ID first.');
      return;
    }
    if (value !== unitId) setUnitId(value);
    setLoading(true); setError(null); setResult(null);
    const key = keys.current.get(value) || createKey();
    keys.current.set(value, key);
    try {
      const response = await api.post('/orders/units/scan/receive/', { unit_id: value }, {
        headers: { 'Idempotency-Key': key },
      });
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Unable to receive this unit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="sales-builder-card">
      <CardHeader title="Receive QR-labelled unit" action={<span className="sales-builder-step">Outlet receipt</span>} />
      <CardContent className="sales-builder-content">
        <div className="sales-builder-intro">
          <div className="sales-builder-intro-icon"><QrCode size={20} /></div>
          <div><h3>Scan each delivered physical unit</h3><p>Receipt is recorded only for a unit dispatched to your assigned outlet. Re-scanning the same unit is safe and will not increase stock twice.</p></div>
        </div>
        {error && <div className="order-builder-alert order-builder-alert-error" role="alert">{error}</div>}
        {result && <div className="order-builder-alert order-builder-alert-success" role="status">Unit receipt has been recorded successfully.</div>}
        {cameraError && <div className="order-builder-alert order-builder-alert-error" role="alert">{cameraError}</div>}
        <form onSubmit={receive} className="mt-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '680px' }}>
          <Input
            label="QR unit ID"
            placeholder="Scan QR code or paste the unit ID"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            autoComplete="off"
          />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary" onClick={() => { setCameraError(null); setCameraOpen(true); }} disabled={cameraOpen || loading}><Camera size={18} />Scan with camera</Button>
            <Button type="submit" disabled={loading} className="order-builder-add-button"><ScanLine size={18} /> {loading ? 'Receiving…' : 'Receive unit'}</Button>
          </div>
        </form>
        {cameraOpen && (
          <section className="mt-5 rounded-xl border" style={{ padding: '1rem', borderColor: 'var(--border-color, #d1d5db)', maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}><strong>Point the camera at the QR label</strong><Button type="button" size="sm" variant="secondary" onClick={stopCamera}><X size={16} /> Close</Button></div>
            <div id="qr-unit-camera" style={{ width: '100%', overflow: 'hidden', borderRadius: 12 }} />
          </section>
        )}
        {result && (
          <section className="mt-6 rounded-xl border" style={{ padding: '1.25rem', borderColor: 'var(--border-color, #d1d5db)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}><CheckCircle2 size={22} color="#10b981" /><strong>Receipt confirmed</strong></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.9rem' }}>
              <div><small className="text-muted">PRODUCT</small><div>{result.product_name || result.productName || '-'}</div></div>
              <div><small className="text-muted">UNIT ID</small><div style={{ wordBreak: 'break-all' }}>{result.unit_id || unitId}</div></div>
              <div><small className="text-muted">STATUS</small><div><PackageCheck size={16} style={{ display: 'inline', marginRight: 5 }} />{String(result.movement_status || result.status || 'RECEIVED').replaceAll('_', ' ')}</div></div>
              <div><small className="text-muted">RECEIVED AT</small><div>{result.received_at ? new Date(result.received_at).toLocaleString() : 'Now'}</div></div>
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
