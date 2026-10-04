import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, QrCode, ScanLine, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const newKey = () => `load-plan-dispatch-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;

const unitIdFromScan = (value) => {
  const raw = String(value || '').trim();
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.unit_id === 'string' ? parsed.unit_id.trim() : raw;
  } catch {
    return raw;
  }
};

export default function QRUnitDispatch({ loadPlan, fulfillment, onDispatched, onRecorded }) {
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const scanner = useRef(null);
  const requestKeys = useRef(new Map());
  const loadPlanId = loadPlan?.loadPlanId || loadPlan?.id;
  const orderId = loadPlan?.orderId;
  const isGodownDispatch = fulfillment?.sourceType === 'GODOWN';

  const stopCamera = async () => {
    const active = scanner.current;
    scanner.current = null;
    if (active?.isScanning) {
      try { await active.stop(); } catch { /* Scanner was already closed. */ }
    }
    active?.clear?.();
    setCameraOpen(false);
  };

  useEffect(() => {
    if (!cameraOpen) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const active = new Html5Qrcode('load-plan-qr-dispatch-camera');
        scanner.current = active;
        await active.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (value) => {
            if (cancelled) return;
            setUnitId(unitIdFromScan(value));
            await stopCamera();
          },
          () => {},
        );
      } catch (scanError) {
        if (!cancelled) {
          setError(scanError?.message || 'Unable to open the camera.');
          setCameraOpen(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      const active = scanner.current;
      scanner.current = null;
      if (active?.isScanning) active.stop().catch(() => {});
    };
  }, [cameraOpen]);

  const dispatch = async (event) => {
    event?.preventDefault();
    const value = unitIdFromScan(unitId);
    if (!value) {
      setError('Scan or enter a QR unit ID first.');
      return;
    }
    if (!loadPlanId || !orderId || (isGodownDispatch && !fulfillment?.lineId)) {
      setError('This load plan is missing its order reference. Refresh the Load Plans page and try again.');
      return;
    }
    setUnitId(value);
    setLoading(true);
    setError(null);
    setResult(null);
    const idempotencyKey = requestKeys.current.get(value) || newKey();
    requestKeys.current.set(value, idempotencyKey);
    try {
      const response = isGodownDispatch
        ? await api.post(
          `/dispatch-plans/${encodeURIComponent(orderId)}/${encodeURIComponent(loadPlanId)}/${encodeURIComponent(fulfillment.lineId)}/godown-dispatch`,
          { unit_id: value },
        )
        : await api.post(
          '/factory/units/scan/dispatch/',
          { unit_id: value, load_plan_id: loadPlanId, order_id: orderId },
          { headers: { 'Idempotency-Key': idempotencyKey } },
        );
      setResult(response);
      setUnitId('');
      onRecorded?.(response);
      if (response.load_plan_dispatched) onDispatched?.(response);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || requestError.message || 'Unable to dispatch this unit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sales-builder-content">
      <div className="sales-builder-intro">
        <div className="sales-builder-intro-icon"><QrCode size={20} /></div>
        <div>
          <h3>Scan a physical unit to mark it dispatched</h3>
          <p>{isGodownDispatch
            ? `Only a QR unit currently held at ${fulfillment.sourceLocationId} for this assigned product is accepted.`
            : 'Only QR labels for the selected Factory-assigned plan products are accepted.'} The plan moves to Dispatch only after every assigned source completes its units.</p>
        </div>
      </div>
      {error && <div className="order-builder-alert order-builder-alert-error" role="alert">{error}</div>}
      {result && (
        <div className="order-builder-alert order-builder-alert-success" role="status">
          <CheckCircle2 size={18} /> {result.product_name || 'Product'} scanned. {result.load_plan_dispatched
            ? 'All units are scanned — the load plan is now dispatched.'
            : (isGodownDispatch ? `${result.lineDispatchedQty} of ${result.lineQuantity} unit(s) dispatched from this godown.` : `${result.scanned_units} of ${result.required_units} unit(s) scanned.`)}
        </div>
      )}
      <form onSubmit={dispatch} className="mt-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="QR unit ID" placeholder="Scan QR code or paste the unit ID" value={unitId} onChange={(event) => setUnitId(event.target.value)} autoComplete="off" />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button type="button" variant="secondary" onClick={() => setCameraOpen(true)} disabled={cameraOpen || loading}><Camera size={18} /> Scan with camera</Button>
          <Button type="submit" disabled={loading} className="order-builder-add-button"><ScanLine size={18} /> {loading ? 'Recording…' : 'Confirm QR scan'}</Button>
        </div>
      </form>
      {cameraOpen && (
        <section className="mt-5 rounded-xl border" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <strong>Point the camera at the QR label</strong>
            <Button type="button" size="sm" variant="secondary" onClick={stopCamera}><X size={16} /> Close</Button>
          </div>
          <div id="load-plan-qr-dispatch-camera" style={{ width: '100%', overflow: 'hidden', borderRadius: 12 }} />
        </section>
      )}
    </div>
  );
}
