import React, { useRef, useState } from 'react';
import { CheckCircle2, PackageCheck, QrCode, ScanLine } from 'lucide-react';
import api from '../api/axios';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const createKey = () => {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `receive-unit-${random}`;
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
  const keys = useRef(new Map());

  const receive = async (event) => {
    event?.preventDefault();
    const value = unitId.trim();
    if (!value) {
      setError('Scan or enter the QR unit ID first.');
      return;
    }
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
        <form onSubmit={receive} className="mt-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '680px' }}>
          <Input
            label="QR unit ID"
            placeholder="Scan QR code or paste the unit ID"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            autoComplete="off"
          />
          <Button type="submit" disabled={loading} className="order-builder-add-button" style={{ alignSelf: 'flex-start' }}><ScanLine size={18} /> {loading ? 'Receiving…' : 'Receive unit'}</Button>
        </form>
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
