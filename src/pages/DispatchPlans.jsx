import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Factory, MapPin, RefreshCw, Truck, Warehouse } from 'lucide-react';
import { fetchDispatchPlans, fetchGodowns, fetchOutlets, manuallyDispatchFulfillment } from '../api/manager';
import { outletLabel } from '../utils/outlets';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { ErrorState, LoadingState } from '../components/ui/StateContainers';
import { Table } from '../components/ui/Table';
import './DispatchPlans.css';
import UndoPlanButton from '../components/UndoPlanButton';

const sourceLabel = (line, godowns) => {
  if (line.sourceType === 'FACTORY') return 'Factory';
  const godown = godowns.find((item) => item.godownId === line.sourceLocationId);
  return godown ? `${godown.godownName || godown.godownId} (${godown.godownId})` : line.sourceLocationId || 'Godown';
};

export default function DispatchPlans({ pendingOnly = false, outletFilter = '' }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [sourceType, setSourceType] = useState('ALL');
  const [godownId, setGodownId] = useState('ALL');
  const [godowns, setGodowns] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLine, setSelectedLine] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchQuantity, setDispatchQuantity] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchDispatchPlans({ sourceType, godownId: sourceType === 'GODOWN' && godownId !== 'ALL' ? godownId : '', pendingOnly, includeDispatched: showCompleted });
      setLines(response?.dispatchPlans || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load dispatch plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGodowns().then((data) => setGodowns(data?.godowns || [])).catch(() => setGodowns([])); fetchOutlets().then((data) => setOutlets(data?.outlets || [])).catch(() => setOutlets([])); }, []);
  useEffect(() => { load(); }, [sourceType, godownId, pendingOnly, showCompleted]);

  const sourceOptions = useMemo(() => [{ value: 'ALL', label: 'All sources' }, { value: 'FACTORY', label: 'Factory' }, { value: 'GODOWN', label: 'Godown' }], []);
  const godownOptions = useMemo(() => [{ value: 'ALL', label: 'All godowns' }, ...godowns.map((godown) => ({ value: godown.godownId, label: `${godown.godownName || godown.godownId} (${godown.godownId})` }))], [godowns]);
  const visibleLines = lines.filter((line) => !outletFilter || outletLabel(line.destinationOutletId, outlets).toLowerCase().includes(outletFilter.toLowerCase()));
  const columns = [
    { key: 'orderId', label: 'Order Ref', render: (line) => line.orderDisplayId || line.orderId },
    { key: 'loadPlanId', label: 'Plan', render: (line) => <span title={line.loadPlanId}>{line.loadPlanId?.slice(0, 8) || '—'}</span> },
    { key: 'createdBy', label: 'Created by', render: (row) => row.createdBy || 'Not recorded' },
    { key: 'isCustomized', label: 'Order type', render: (row) => row.isCustomized ? <strong style={{ color: 'var(--color-primary)' }}>Customized</strong> : 'Standard' },
    { key: 'source', label: 'Dispatch from', render: (line) => <span className={`dispatch-source dispatch-source--${line.sourceType?.toLowerCase()}`}>{line.sourceType === 'FACTORY' ? <Factory size={15} /> : <Warehouse size={15} />}{sourceLabel(line, godowns)}</span> },
    { key: 'destinationOutletId', label: 'Destination outlet', render: (line) => outletLabel(line.destinationOutletId, outlets) },
    { key: 'productName', label: 'Product', render: (line) => line.productName || line.productId },
    { key: 'quantity', label: 'Progress', align: 'center', render: (line) => `${line.dispatchedQty || 0} / ${line.quantity || 0}` },
    { key: 'dispatchPendingQty', label: 'Dispatch Pending', align: 'center', render: (line) => Number(line.quantity || 0) - Number(line.dispatchedQty || 0) },
    { key: 'action', label: 'Action', align: 'right', render: (line) => <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      {Number(line.dispatchedQty || 0) < Number(line.quantity || 0) && <Button variant="primary" onClick={() => { setDispatchError(''); setDispatchQuantity(String(Number(line.quantity || 0) - Number(line.dispatchedQty || 0))); setSelectedLine(line); }}><Truck size={17} /> Mark dispatched</Button>}
      {Number(line.dispatchedQty || 0) > 0 && <UndoPlanButton plan={line} action="dispatch" onUndone={load} />}
    </div> },
  ];

  const confirmDispatch = async () => {
    if (!selectedLine) return;
    const quantity = Number(dispatchQuantity);
    const remaining = Number(selectedLine.quantity) - Number(selectedLine.dispatchedQty || 0);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > remaining) {
      setDispatchError(`Enter a whole quantity between 1 and ${remaining}.`);
      return;
    }
    setDispatching(true); setDispatchError('');
    try {
      await manuallyDispatchFulfillment(selectedLine, quantity);
      setSelectedLine(null);
      await load();
    } catch (requestError) {
      setDispatchError(requestError.response?.data?.error || 'Unable to mark this product as dispatched.');
    } finally { setDispatching(false); }
  };

  return <main className="dispatch-plans-page">
    <section className="dispatch-plans-hero"><Truck size={29} /><div><p>FULFILLMENT CONTROL</p><h2>{pendingOnly ? 'Dispatch Pending' : 'Dispatch Plans'}</h2><span>Confirm each assigned product line manually from Factory or Godown.</span></div></section>
    <Card>
      <CardHeader title={showCompleted ? "Assigned products" : "Assigned products awaiting dispatch"} action={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</Button>} />
      <CardContent>
        <div className="dispatch-plan-filters">
          {!pendingOnly && <Select label="Show" value={showCompleted ? 'ALL' : 'PENDING'} onChange={(event) => setShowCompleted(event.target.value === 'ALL')} options={[{ value: 'PENDING', label: 'Awaiting dispatch' }, { value: 'ALL', label: 'All assignments (including dispatched)' }]} />}
          <Select label="Dispatch source" value={sourceType} onChange={(event) => { setSourceType(event.target.value); if (event.target.value !== 'GODOWN') setGodownId('ALL'); }} options={sourceOptions} />
          {sourceType === 'GODOWN' && <Select label="Godown" value={godownId} onChange={(event) => setGodownId(event.target.value)} options={godownOptions} />}
          <div className="dispatch-plan-count"><MapPin size={18} /><strong>{visibleLines.length}</strong> pending product line{visibleLines.length === 1 ? '' : 's'}</div>
        </div>
        {loading ? <LoadingState message="Loading assigned dispatch plans..." /> : error ? <ErrorState error={error} onRetry={load} /> : <Table columns={columns} data={visibleLines} emptyStateMessage="No assigned product lines are awaiting dispatch for this filter." />}
      </CardContent>
    </Card>
    <Modal isOpen={Boolean(selectedLine)} onClose={() => !dispatching && setSelectedLine(null)} title={`Mark dispatched — ${selectedLine?.productName || 'Product'}`}>
      {selectedLine && <div className="manual-dispatch-confirmation">
        <CheckCircle2 size={28} />
        <p>There are <strong>{Number(selectedLine.quantity || 0) - Number(selectedLine.dispatchedQty || 0)} unit(s)</strong> awaiting dispatch from <strong>{sourceLabel(selectedLine, godowns)}</strong> to <strong>{outletLabel(selectedLine.destinationOutletId, outlets)}</strong>.</p>
        <Input label="Quantity to dispatch now" type="number" min="1" max={Number(selectedLine.quantity) - Number(selectedLine.dispatchedQty || 0)} step="1" value={dispatchQuantity} onChange={(event) => setDispatchQuantity(event.target.value)} disabled={dispatching} />
        <p>Any remaining quantity will stay in Orders → Dispatch Pending.</p>
        {selectedLine.sourceType === 'GODOWN' && <small>The same quantity will be deducted from this godown&apos;s reserved stock.</small>}
        {dispatchError && <div className="manual-dispatch-error">{dispatchError}</div>}
        <div className="manual-dispatch-actions"><Button variant="secondary" onClick={() => setSelectedLine(null)} disabled={dispatching}>Cancel</Button><Button variant="primary" onClick={confirmDispatch} disabled={dispatching}><Truck size={17} />{dispatching ? 'Marking…' : 'Confirm dispatch'}</Button></div>
      </div>}
    </Modal>
  </main>;
}
