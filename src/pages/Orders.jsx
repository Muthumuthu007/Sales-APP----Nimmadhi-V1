import {orderContents} from '../utils/orderContents';
import OrderContentsColumn from '../components/OrderContentsColumn';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { Button } from '../components/ui/Button';
import { fetchOrders, fetchOutlets } from '../api/manager';
import { outletLabel } from '../utils/outlets';
import './Orders.css';
import DispatchPlans from './DispatchPlans';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, PARTIALLY_APPROVED, REJECTED, DISPATCHED, RECEIVED
  const [outletFilter, setOutletFilter] = useState('');
  const [outlets, setOutlets] = useState([]);
  const navigate = useNavigate();

  const tabs = [
    { id: 'PENDING', label: 'Pending' },
    { id: 'PARTIALLY_APPROVED', label: 'Partial' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'DISPATCH_PENDING', label: 'Dispatch Pending' },
    { id: 'DISPATCHED', label: 'Dispatched' },
    { id: 'RECEIVED', label: 'Received' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  useEffect(() => {
    if (activeTab === 'DISPATCH_PENDING') return;
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

  useEffect(() => {
    fetchOutlets().then((response) => setOutlets(response?.outlets || [])).catch(() => setOutlets([]));
  }, []);

  const filteredOrders = outletFilter 
    ? orders.filter((order) => outletLabel(order.outletId, outlets).toLowerCase().includes(outletFilter.toLowerCase()))
    : orders;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Orders Management</h2>
      </div>

      {/* Toolbar: on desktop — tabs left, search right; on mobile — search top, tabs bottom */}
      <div className="orders-toolbar">
        <div className="orders-search">
          <Input
            placeholder="Filter by outlet name or ID..."
            value={outletFilter}
            onChange={(e) => setOutletFilter(e.target.value)}
          />
        </div>
        <div className="orders-tabs">
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
                whiteSpace: 'nowrap',
                minHeight: '44px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'DISPATCH_PENDING' ? <DispatchPlans pendingOnly outletFilter={outletFilter} /> : <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={() => setActiveTab(activeTab)} />
        ) : (
          <CardContent style={{ padding: 0 }}>
            <div className="order-summary-list">
              {!filteredOrders.length && <p className="order-list-empty">No orders found for this selection.</p>}
              {filteredOrders.map(row => {
                const contents=orderContents(row.items || []);
                return <article className="order-summary-card" key={row.orderId}>
                  <div className="order-summary-heading">
                    <div><strong className="order-summary-reference">{row.displayId || row.orderId}</strong><span className="order-summary-outlet">{outletLabel(row.outletId,outlets)}</span></div>
                    <Badge status={row.status}/>
                  </div>
                  <div className="order-summary-meta"><span>Created by <strong>{row.createdByName || 'Not recorded'}</strong></span><span>{row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : 'Date not recorded'}</span><span>{row.isCustomized?'Customized':'Standard'} order</span></div>
                  <div className="order-summary-bottom">
                    <div className="order-summary-counts"><span><strong>{contents.productTotal}</strong> ordered · {contents.products.length} product types</span><span><strong>{contents.complimentaryTotal || contents.offerTotal}</strong> complimentary {contents.complimentaryTotal?'allocated':contents.offerTotal?'offered':'items'}{contents.complimentaryTotal>0 && contents.offerTotal>0 ? ` · ${contents.offerTotal} additionally offered` : ''}</span></div>
                    <Button variant="secondary" onClick={()=>navigate(`/orders/${row.orderId}`,{state:{order:row}})}>View order / Approve</Button>
                  </div>
                  <details className="order-summary-details"><summary>View products and complimentary items</summary><div className="order-summary-contents"><section><h3>Products ordered</h3><OrderContentsColumn items={row.items || []}/></section><section><h3>Complimentary products</h3><OrderContentsColumn items={row.items || []} complimentary/></section></div></details>
                </article>;
              })}
            </div>
          </CardContent>
        )}
      </Card>}
    </div>
  );
};

export default Orders;
