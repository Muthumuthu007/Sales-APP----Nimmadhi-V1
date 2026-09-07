import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { Button } from '../components/ui/Button';
import { fetchOrders } from '../api/manager';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, PARTIALLY_APPROVED, REJECTED, DISPATCHED, RECEIVED
  const [outletFilter, setOutletFilter] = useState('');
  const navigate = useNavigate();

  const tabs = [
    { id: 'PENDING', label: 'Pending' },
    { id: 'PARTIALLY_APPROVED', label: 'Partial' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'DISPATCHED', label: 'Dispatched' },
    { id: 'RECEIVED', label: 'Received' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  useEffect(() => {
    let isMounted = true;
    
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchOrders(activeTab);
        if (isMounted) {
          // Assume response returns array directly, or response.orders
          setOrders(Array.isArray(response) ? response : (response.orders || []));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to fetch orders.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const columns = [
    { key: 'displayId', label: 'Order Ref', render: (row) => <span title={row.orderId}>{row.displayId || row.orderId}</span> },
    { key: 'outletId', label: 'Outlet ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'status', label: 'Status', render: (row) => (
      <Badge status={(row.status === 'PENDING' && activeTab === 'PARTIALLY_APPROVED') ? 'PARTIALLY_APPROVED' : row.status} /> 
    )},
    { key: 'actions', label: 'Actions', align: 'right', render: (row) => (
      <Button 
        variant="secondary" 
        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        onClick={() => navigate(`/orders/${row.orderId}`, { state: { order: row } })}
      >
        View / Approve
      </Button>
    )}
  ];

  const filteredOrders = outletFilter 
    ? orders.filter(o => o.outletId && o.outletId.toLowerCase().includes(outletFilter.toLowerCase()))
    : orders;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Orders Management</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: '2rem', overflowX: 'auto', paddingBottom: '0.5rem', flex: 1 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', padding: '0.5rem 0',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ paddingLeft: '1rem', minWidth: '250px' }}>
          <Input 
             placeholder="Filter by Outlet ID..."
             value={outletFilter}
             onChange={(e) => setOutletFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={() => setActiveTab(activeTab)} />
        ) : (
          <CardContent style={{ padding: 0 }}>
            <Table 
              columns={columns} 
              data={filteredOrders}
              emptyStateMessage={outletFilter ? `No orders found for outlet "${outletFilter}"` : `No orders found with status ${activeTab}.`}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Orders;
