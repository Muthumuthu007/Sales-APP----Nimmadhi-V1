import React, { useContext, useEffect, useState } from 'react';
import { PackageCheck, Warehouse } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { fetchGodownStock } from '../api/manager';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';

export default function GodownView() {
  const { outletId, outletName } = useContext(AuthContext);
  const [stock, setStock] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const response = await fetchGodownStock(outletId); setStock(response.stock || []); } catch (err) { setError(err.response?.data?.error || 'Unable to load godown stock.'); } finally { setLoading(false); } };
  useEffect(() => { if (outletId) load(); }, [outletId]);
  return <main className="outlet-view"><section className="outlet-hero"><Warehouse size={28} /><div><h2>{outletName || outletId} — Godown</h2><p>Stock reserved by a manager will appear here for QR dispatch to outlets.</p></div></section><Card><CardHeader title="Godown stock" action={<PackageCheck size={20} />} /><CardContent>{loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={load} /> : <Table columns={[{ key: 'productName', label: 'Product' }, { key: 'closingQty', label: 'In stock', align: 'center' }, { key: 'reservedQty', label: 'Reserved', align: 'center' }, { key: 'availableQty', label: 'Available', align: 'center' }]} data={stock} emptyStateMessage="No QR units have been received at this godown yet." />}</CardContent></Card></main>;
}
