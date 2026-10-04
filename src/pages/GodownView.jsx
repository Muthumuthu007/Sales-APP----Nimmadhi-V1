import React, { useContext, useEffect, useState } from 'react';
import { PackageCheck, Warehouse } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { fetchGodownStock, receiveGodownUnit } from '../api/manager';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';

export default function GodownView() {
  const { outletId, outletName } = useContext(AuthContext);
  const [stock, setStock] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [unitId, setUnitId] = useState(''); const [notice, setNotice] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const response = await fetchGodownStock(outletId); setStock(response.stock || []); } catch (err) { setError(err.response?.data?.error || 'Unable to load godown stock.'); } finally { setLoading(false); } };
  useEffect(() => { if (outletId) load(); }, [outletId]);
  const receive = async (event) => { event.preventDefault(); if (!unitId.trim()) return; setError(''); setNotice(''); try { await receiveGodownUnit(unitId); setUnitId(''); setNotice('QR unit received into godown stock.'); await load(); } catch (err) { setError(err.response?.data?.error || 'Unable to receive this QR unit.'); } };
  return <main className="outlet-view"><section className="outlet-hero"><Warehouse size={28} /><div><h2>{outletName || outletId} — Godown</h2><p>Receive factory QR units here. Stock reserved by a manager will appear for outlet dispatch.</p></div></section>{notice && <div className="outlets-alert outlets-alert-success">{notice}</div>}<Card><CardHeader title="Receive QR unit from factory" /><CardContent><form onSubmit={receive} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}><Input label="QR unit ID" value={unitId} onChange={(event) => setUnitId(event.target.value)} placeholder="Scan or paste QR unit ID" /><Button type="submit">Receive into godown</Button></form></CardContent></Card><Card><CardHeader title="Godown stock" action={<PackageCheck size={20} />} /><CardContent>{loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={load} /> : <Table columns={[{ key: 'productName', label: 'Product' }, { key: 'closingQty', label: 'In stock', align: 'center' }, { key: 'reservedQty', label: 'Reserved', align: 'center' }, { key: 'availableQty', label: 'Available', align: 'center' }]} data={stock} emptyStateMessage="No QR units have been received at this godown yet." />}</CardContent></Card></main>;
}
