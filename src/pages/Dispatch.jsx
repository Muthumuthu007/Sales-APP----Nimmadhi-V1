import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Input';
import { fetchOrders, fetchOutlets } from '../api/manager';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import './Dispatch.css';

const Dispatch = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState(() => sessionStorage.getItem('managerLogisticsOutletId') || 'ALL');

  const loadDispatchedHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchOrders('DISPATCHED');
      setOrders(Array.isArray(response) ? response : (response.orders || []));
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
      render: (row) => <span title={row.orderId}>{row.displayId || '—'}</span>,
    },
    { key: 'outletId', label: 'Destination Outlet' },
    {
      key: 'createdAt',
      label: 'Registered Date',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '—',
    },
    { key: 'dispatchedAt', label: 'Dispatch Timestamp', render: (row) => row.dispatchedAt || '-' },
    { key: 'status', label: 'Transit Status', render: (row) => <Badge status={row.status || 'DISPATCHED'} /> },
  ];

  const outletOptions = [
    { value: 'ALL', label: 'All outlets' },
    ...outlets.map((outlet) => ({ value: outlet.outletId, label: `${outlet.outletId}${outlet.username ? ` — ${outlet.username}` : ''}` })),
  ];
  const visibleOrders = selectedOutletId === 'ALL'
    ? orders
    : orders.filter((order) => order.outletId === selectedOutletId);

  const handleOutletChange = (event) => {
    const outletId = event.target.value;
    setSelectedOutletId(outletId);
    sessionStorage.setItem('managerLogisticsOutletId', outletId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dispatch-toolbar">
        <div>
          <h2>Dispatch History & Logistics</h2>
          <p>Select an outlet to view only its dispatched orders.</p>
        </div>
        <Select label="Outlet" value={selectedOutletId} onChange={handleOutletChange} options={outletOptions} />
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
    </div>
  );
};

export default Dispatch;
