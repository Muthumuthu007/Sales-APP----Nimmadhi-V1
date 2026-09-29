import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { fetchDispatchedLoadPlans, fetchOutlets, downloadDispatchedLoadPlansExcel } from '../api/manager';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import './Dispatch.css';

const Dispatch = () => {
  const [orders, setOrders] = useState([]);
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
      const response = await fetchDispatchedLoadPlans();
      setOrders(Array.isArray(response) ? response : (response.loadPlans || []));
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
    { key: 'outletId', label: 'Destination Outlet' },
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
  ];

  const outletOptions = [
    { value: 'ALL', label: 'All outlets' },
    ...outlets.map((outlet) => ({ value: outlet.outletId, label: `${outlet.outletId}${outlet.outletName || outlet.username ? ` — ${outlet.outletName || outlet.username}` : ''}` })),
  ];
  const visibleOrders = selectedOutletId === 'ALL'
    ? orders
    : orders.filter((order) => order.outletId === selectedOutletId);

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
          <p>Select an outlet to view only its dispatched orders.</p>
        </div>
        <div className="dispatch-toolbar-actions">
          <Select label="Outlet" value={selectedOutletId} onChange={handleOutletChange} options={outletOptions} />
          <Button variant="secondary" onClick={handleDownloadExcel} disabled={isDownloading || loading || orders.length === 0}>
            {isDownloading ? 'Downloading...' : 'Export to Excel'}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader title="Successfully Dispatched Shipments — Grouped by Outlet" />
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={loadDispatchedHistory} />
        ) : (
          <CardContent style={{ padding: 0 }}>
            <Table
              columns={columns}
              data={visibleOrders}
              emptyStateMessage={selectedOutletId === 'ALL'
                ? 'No dispatched factory shipments historical records found.'
                : `No dispatched orders found for ${selectedOutletId}.`}
            />
          </CardContent>
        )}
      </Card>

      <Modal
        isOpen={Boolean(detailsPlan)}
        onClose={() => setDetailsPlan(null)}
        title={`Dispatched order ${detailsPlan?.orderDisplayId || '—'}`}
      >
        <div className="dispatch-detail-summary">
          <div><span>Outlet</span><strong>{detailsPlan?.outletId || '—'}</strong></div>
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
              { key: 'maxProduce', label: 'Capacity', align: 'center', render: (item) => item.maxProduce ?? '—' },
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
