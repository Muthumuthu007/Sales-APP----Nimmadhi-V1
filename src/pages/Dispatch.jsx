import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { fetchOrders } from '../api/manager';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import './Dispatch.css';

const groupByOutlet = (orders) => orders.reduce((groups, order) => {
  const outletId = order.outletId || 'UNASSIGNED';
  if (!groups[outletId]) groups[outletId] = [];
  groups[outletId].push(order);
  return groups;
}, {});

const Dispatch = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const ordersByOutlet = groupByOutlet(orders);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ margin: 0 }}>Dispatch History & Logistics</h2>
      
      <Card>
        <CardHeader title="Successfully Dispatched Shipments — Grouped by Outlet" />
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={loadDispatchedHistory} />
        ) : (
          <CardContent className="dispatch-by-outlet">
            {Object.keys(ordersByOutlet).length === 0 ? (
              <p className="dispatch-empty">No dispatched factory shipments historical records found.</p>
            ) : Object.entries(ordersByOutlet).map(([outletId, outletOrders]) => (
              <section className="dispatch-outlet-group" key={outletId}>
                <div className="dispatch-outlet-header">
                  <div>
                    <p>Destination outlet</p>
                    <h3>{outletId}</h3>
                  </div>
                  <span>{outletOrders.length} {outletOrders.length === 1 ? 'shipment' : 'shipments'}</span>
                </div>
                <Table
                  columns={columns}
                  data={outletOrders}
                  emptyStateMessage="No dispatched shipments for this outlet."
                />
              </section>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Dispatch;
