import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { fetchOrders } from '../api/manager';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';

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
    { key: 'orderId', label: 'Order ID' },
    { key: 'outletId', label: 'Destination Outlet' },
    { key: 'createdAt', label: 'Registered Date' },
    { key: 'dispatchedAt', label: 'Dispatch Timestamp', render: (row) => row.dispatchedAt || '-' },
    { key: 'status', label: 'Transit Status', render: (row) => <Badge status={row.status || 'DISPATCHED'} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ margin: 0 }}>Dispatch History & Logistics</h2>
      
      <Card>
        <CardHeader title="Successfully Dispatched Shipments Log" />
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={loadDispatchedHistory} />
        ) : (
          <CardContent style={{ padding: 0 }}>
            <Table 
              columns={columns} 
              data={orders} 
              emptyStateMessage="No dispatched factory shipments historical records found." 
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Dispatch;
