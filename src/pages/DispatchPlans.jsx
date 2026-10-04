import React, { useEffect, useMemo, useState } from 'react';
import { Factory, MapPin, QrCode, RefreshCw, Warehouse } from 'lucide-react';
import { fetchDispatchPlans, fetchGodowns, fetchOutlets } from '../api/manager';
import { outletLabel } from '../utils/outlets';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { ErrorState, LoadingState } from '../components/ui/StateContainers';
import { Table } from '../components/ui/Table';
import QRUnitDispatch from './QRUnitDispatch';
import './DispatchPlans.css';

const sourceLabel = (line, godowns) => {
  if (line.sourceType === 'FACTORY') return 'Factory';
  const godown = godowns.find((item) => item.godownId === line.sourceLocationId);
  return godown ? `${godown.godownName || godown.godownId} (${godown.godownId})` : line.sourceLocationId || 'Godown';
};

export default function DispatchPlans() {
  const [sourceType, setSourceType] = useState('ALL');
  const [godownId, setGodownId] = useState('ALL');
  const [godowns, setGodowns] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLine, setSelectedLine] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchDispatchPlans({ sourceType, godownId: sourceType === 'GODOWN' && godownId !== 'ALL' ? godownId : '' });
      setLines(response?.dispatchPlans || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load dispatch plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGodowns().then((data) => setGodowns(data?.godowns || [])).catch(() => setGodowns([])); fetchOutlets().then((data) => setOutlets(data?.outlets || [])).catch(() => setOutlets([])); }, []);
  useEffect(() => { load(); }, [sourceType, godownId]);

  const sourceOptions = useMemo(() => [{ value: 'ALL', label: 'All sources' }, { value: 'FACTORY', label: 'Factory' }, { value: 'GODOWN', label: 'Godown' }], []);
  const godownOptions = useMemo(() => [{ value: 'ALL', label: 'All godowns' }, ...godowns.map((godown) => ({ value: godown.godownId, label: `${godown.godownName || godown.godownId} (${godown.godownId})` }))], [godowns]);
  const columns = [
    { key: 'loadPlanId', label: 'Plan', render: (line) => <span title={line.loadPlanId}>{line.loadPlanId?.slice(0, 8) || '—'}</span> },
    { key: 'source', label: 'Dispatch from', render: (line) => <span className={`dispatch-source dispatch-source--${line.sourceType?.toLowerCase()}`}>{line.sourceType === 'FACTORY' ? <Factory size={15} /> : <Warehouse size={15} />}{sourceLabel(line, godowns)}</span> },
    { key: 'destinationOutletId', label: 'Destination outlet', render: (line) => outletLabel(line.destinationOutletId, outlets) },
    { key: 'productName', label: 'Product', render: (line) => line.productName || line.productId },
    { key: 'quantity', label: 'Progress', align: 'center', render: (line) => `${line.dispatchedQty || 0} / ${line.quantity || 0}` },
    { key: 'action', label: 'Action', align: 'right', render: (line) => <Button variant="primary" onClick={() => setSelectedLine(line)}><QrCode size={17} /> Mark dispatched</Button> },
  ];

  return <main className="dispatch-plans-page">
    <section className="dispatch-plans-hero"><QrCode size={29} /><div><p>FULFILLMENT CONTROL</p><h2>Dispatch Plans</h2><span>Scan each assigned QR unit to mark it dispatched from Factory or Godown.</span></div></section>
    <Card>
      <CardHeader title="Assigned products awaiting dispatch" action={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</Button>} />
      <CardContent>
        <div className="dispatch-plan-filters">
          <Select label="Dispatch source" value={sourceType} onChange={(event) => { setSourceType(event.target.value); if (event.target.value !== 'GODOWN') setGodownId('ALL'); }} options={sourceOptions} />
          {sourceType === 'GODOWN' && <Select label="Godown" value={godownId} onChange={(event) => setGodownId(event.target.value)} options={godownOptions} />}
          <div className="dispatch-plan-count"><MapPin size={18} /><strong>{lines.length}</strong> pending product line{lines.length === 1 ? '' : 's'}</div>
        </div>
        {loading ? <LoadingState message="Loading assigned dispatch plans..." /> : error ? <ErrorState error={error} onRetry={load} /> : <Table columns={columns} data={lines} emptyStateMessage="No assigned product lines are awaiting dispatch for this filter." />}
      </CardContent>
    </Card>
    <Modal isOpen={Boolean(selectedLine)} onClose={() => setSelectedLine(null)} title={`Mark dispatched — ${selectedLine?.productName || 'Product'}`}>
      {selectedLine && <QRUnitDispatch loadPlan={{ loadPlanId: selectedLine.loadPlanId, orderId: selectedLine.orderId }} fulfillment={selectedLine} onDispatched={() => { load(); }} />}
    </Modal>
  </main>;
}
