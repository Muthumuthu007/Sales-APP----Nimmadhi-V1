import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { fetchDispatchedLoadPlans, fetchDispatchHistory, fetchOutlets, downloadDispatchedLoadPlansExcel } from '../api/manager';
import { outletLabel } from '../utils/outlets';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import './Dispatch.css';
import UndoPlanButton from '../components/UndoPlanButton';

const Dispatch = () => {
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [historyTab, setHistoryTab] = useState('BATCHES');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState(() => sessionStorage.getItem('managerLogisticsOutletId') || 'ALL');
  const [detailsPlan, setDetailsPlan] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadDispatchedHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [response, history] = await Promise.all([fetchDispatchedLoadPlans(), fetchDispatchHistory()]);
      const plans = Array.isArray(response) ? response : (response.loadPlans || []);
      const plansById = new Map(plans.map(plan => [plan.loadPlanId, plan]));
      setBatches((history.dispatches || []).map(batch => ({ ...batch, planDisplayId: plansById.get(batch.loadPlanId)?.displayId })));
      setOrders(plans);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch dispatched history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatchedHistory();
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchOutlets().then((response) => {
      if (isMounted) setOutlets(response?.outlets || []);
    }).catch(() => {
      if (isMounted) setOutlets([]);
    });
    return () => { isMounted = false; };
  }, []);

  const columns = [
    {
      key: 'displayId',
      label: 'Order Ref',
      render: (row) => <span title={row.orderId}>{row.orderDisplayId || '—'}</span>,
    },
    { key: 'createdBy', label: 'Created by', render: (row) => row.createdByName || (row.createdBy ? 'Name unavailable' : 'Not recorded') },
    { key: 'isCustomized', label: 'Order type', render: (row) => row.isCustomized ? <strong style={{ color: 'var(--color-primary)' }}>Customized</strong> : 'Standard' },
    { key: 'outletId', label: 'Destination Outlet', render: (row) => outletLabel(row.outletId, outlets) },
    {
      key: 'createdAt',
      label: 'Registered Date',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
    },
    { key: 'dispatchedAt', label: 'Dispatch Timestamp', render: (row) => row.dispatchedAt ? new Date(row.dispatchedAt).toLocaleString() : '—' },
    { key: 'status', label: 'Transit Status', render: (row) => <Badge status={row.status || 'DISPATCHED'} /> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      className: 'dispatch-action-column',
      render: (row) => (
        <Button variant="secondary" className="dispatch-view-button" onClick={() => setDetailsPlan(row)}>
          View products
        </Button>
      ),
    },
    {
      key: 'undo', label: 'Undo',
      render: (row) => <UndoPlanButton plan={row} action="dispatch" onUndone={loadDispatchedHistory} />,
    },
  ];

  const batchReference = row => `DSP-${row.dispatchId?.slice(0, 8).toUpperCase() || '—'}`;
  const showBatchDetails = row => setDetailsPlan({ ...row, isBatch: true,
    displayId: row.planDisplayId || row.loadPlanId,
    items: [{ productName: row.productName, product_id: row.productId, quantity: row.quantity }],
  });
  const batchColumns = [
    { key: 'dispatchId', label: 'Dispatch ID', render: row => <span title={row.dispatchId}>{batchReference(row)}</span> },
    { key: 'orderDisplayId', label: 'Order Ref', render: row => row.orderDisplayId || row.orderId },
    { key: 'loadPlanId', label: 'Load plan', render: row => <span title={row.loadPlanId}>{row.planDisplayId || row.loadPlanId?.slice(0, 8) || '—'}</span> },
    { key: 'outletId', label: 'Destination outlet', render: row => outletLabel(row.outletId, outlets) },
    { key: 'productName', label: 'Product', className: 'dispatch-batch-product', render: row => row.productName || row.productId },
    { key: 'quantity', label: 'Batch quantity', align: 'center' },
    { key: 'sourceType', label: 'Dispatch source', render: row => row.sourceType === 'FACTORY' ? 'Factory' : `Godown · ${row.sourceLocationId}` },
    { key: 'dispatchOrigin', label: 'Dispatch type', render: row => <span className={`dispatch-batch-tag ${row.dispatchOrigin === 'PENDING' ? 'dispatch-batch-tag--pending' : ''}`}>{row.dispatchOrigin === 'PENDING' ? 'From Dispatch Pending' : 'Original dispatch'}</span> },
    { key: 'dispatchedAt', label: 'Dispatched at', render: row => new Date(row.dispatchedAt).toLocaleString() },
    { key: 'dispatchedBy', label: 'Dispatched by' },
    { key: 'actions', label: 'Details', render: row => <Button variant="secondary" onClick={() => showBatchDetails(row)}>View dispatch</Button> },
  ];

  const outletOptions = [
    { value: 'ALL', label: 'All outlets' },
    ...outlets.map((outlet) => ({ value: outlet.outletId, label: `${outlet.outletId}${outlet.outletName || outlet.username ? ` — ${outlet.outletName || outlet.username}` : ''}` })),
  ];
  const visibleOrders = selectedOutletId === 'ALL'
    ? orders
    : orders.filter((order) => order.outletId === selectedOutletId);

  const outletBatches = batches.filter(row => selectedOutletId === 'ALL' || row.outletId === selectedOutletId);
  const pendingBatches = outletBatches.filter(row => row.dispatchOrigin === 'PENDING');
  const visibleBatches = historyTab === 'PENDING' ? pendingBatches : outletBatches;

  const handleOutletChange = (event) => {
    const outletId = event.target.value;
    setSelectedOutletId(outletId);
    sessionStorage.setItem('managerLogisticsOutletId', outletId);
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const blob = await downloadDispatchedLoadPlansExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dispatched_load_plans.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download the dispatched-load-plan Excel report.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dispatch-toolbar">
        <div>
          <h2>Dispatch History & Logistics</h2>
          <p>View completed load plans and each separately recorded dispatch batch.</p>
        </div>
        <div className="dispatch-toolbar-actions">
          <Select label="Outlet" value={selectedOutletId} onChange={handleOutletChange} options={outletOptions} />
          <Button variant="secondary" onClick={loadDispatchedHistory} disabled={loading}>Refresh</Button>
          {historyTab === 'PLANS' && <Button variant="secondary" onClick={handleDownloadExcel} disabled={isDownloading || loading || orders.length === 0}>
            {isDownloading ? 'Downloading...' : 'Export to Excel'}
          </Button>}
        </div>
      </div>
      <div className="dispatch-history-tabs" aria-label="Dispatch history views">
        {[['BATCHES', 'Dispatches', outletBatches.length], ['PENDING', 'From Dispatch Pending', pendingBatches.length], ['PLANS', 'Load plan totals', visibleOrders.length]].map(([value, label, count]) =>
          <button key={value} type="button" className={historyTab === value ? 'active' : ''} aria-pressed={historyTab === value} onClick={() => setHistoryTab(value)}>{label}<span>{count}</span></button>
        )}
      </div>
      {historyTab !== 'PLANS' && <p className="dispatch-history-note">Each row shows only the quantity sent in that dispatch. Earlier shipments remain available in Load plan totals; individual batches are recorded from this update onward.</p>}
      <Card>
        <CardHeader title={historyTab === 'PLANS' ? 'Completed load plans' : historyTab === 'PENDING' ? 'Shipments completed from Dispatch Pending' : 'Individual dispatch batches'} />
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={loadDispatchedHistory} />
        ) : (
          <CardContent style={{ padding: 0 }}>
            <Table
              columns={historyTab === 'PLANS' ? columns : batchColumns}
              data={historyTab === 'PLANS' ? visibleOrders : visibleBatches}
              emptyStateMessage={historyTab !== 'PLANS' ? 'No dispatch batches recorded for this filter.' : selectedOutletId === 'ALL'
                ? 'No dispatched factory shipments historical records found.'
                : `No dispatched orders found for ${selectedOutletId}.`}
            />
          </CardContent>
        )}
      </Card>

      <Modal
        isOpen={Boolean(detailsPlan)}
        onClose={() => setDetailsPlan(null)}
        title={detailsPlan?.isBatch ? `Dispatch ${batchReference(detailsPlan)}` : `Load plan total · ${detailsPlan?.orderDisplayId || '—'}`}
      >
        <div className="dispatch-detail-summary">
          {detailsPlan?.isBatch && <><div><span>Dispatch ID</span><strong title={detailsPlan.dispatchId}>{batchReference(detailsPlan)}</strong></div><div><span>Order</span><strong>{detailsPlan.orderDisplayId || detailsPlan.orderId}</strong></div></>}
          <div><span>Outlet</span><strong>{outletLabel(detailsPlan?.outletId, outlets)}</strong></div>
          <div><span>Load plan</span><strong>{detailsPlan?.displayId || '—'}</strong></div>
          <div><span>Dispatched</span><strong>{detailsPlan?.dispatchedAt ? new Date(detailsPlan.dispatchedAt).toLocaleString() : '—'}</strong></div>
          <div><span>Dispatched by</span><strong>{detailsPlan?.dispatchedBy || '—'}</strong></div>
        </div>
        <div className="dispatch-detail-items">
          <h4>Products dispatched</h4>
          <Table
            columns={[
              { key: 'productName', label: 'Product', render: (item) => item.productName || item.product_id || '—' },
              { key: 'quantity', label: 'Quantity', align: 'center', render: (item) => item.quantity ?? '—' },
              ...(!detailsPlan?.isBatch ? [{ key: 'maxProduce', label: 'Capacity', align: 'center', render: (item) => item.maxProduce ?? '—' }] : []),
              { key: 'isFree', label: 'Type', render: (item) => item.isFree ? 'Free item' : 'Ordered item' },
            ]}
            data={detailsPlan?.items || []}
            emptyStateMessage="No product details are available for this dispatched load plan."
          />
        </div>
      </Modal>
    </div>
  );
};

export default Dispatch;
