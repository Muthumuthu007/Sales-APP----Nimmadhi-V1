import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { fetchAllOrders, approveOrder, fetchLoadPlans, rejectOrder } from '../api/manager';
import axios from 'axios';

const OrderDetails = () => {
  const { id } = useParams(); // refers to orderId
  const navigate = useNavigate();
  const location = useLocation();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');

  // We maintain an explicit array of items with their approval data decoupled from the baseline 'order.items'
  const [approvalItems, setApprovalItems] = useState([]);

  // Fetch optional product options so free items dropdown works gracefully
  const [productOptions, setProductOptions] = useState([{ label: 'Loading products...', value: '' }]);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Resolve Order Fallback if lost state
    async function loadOrder() {
      if (!location.state?.order) {
        try {
          const response = await fetchAllOrders();
          const list = Array.isArray(response) ? response : (response.orders || []);
          const found = list.find(o => o.orderId === id || o.id === id);
          if (found) {
             if (isMounted) setOrder(found);
          } else {
             if (isMounted) setError('Order not found.');
          }
        } catch (err) {
          if (isMounted) setError(err.message || 'Failed to fetch order details.');
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    }

    // 2. Resolve global products for free items dropdown
    async function loadProducts() {
      try {
        // Safe relative internal call to api
        const res = await axios.get(import.meta.env.VITE_API_BASE_URL.replace('/api', '') + '/api/products');
        const list = res.data?.products || [];
        const options = [{ label: 'Select product...', value: '' }, ...list.map(p => {
          if (typeof p === 'object' && p) {
            const pid = p.id || p.product_id || p.uuid;
            const pname = p.name || p.product_name || p.title;
            return { label: pname || pid, value: pid || pname };
          }
          return { label: String(p), value: String(p) };
        })];
        if (isMounted) setProductOptions(options);
      } catch (err) {
        if (isMounted) setProductOptions([{ label: 'Product List Unavailable', value: '' }]);
      }
    }

    loadOrder();
    loadProducts();
    
    return () => { isMounted = false; };
  }, [id, location.state]);

  // Synchronize dynamic table inputs on order load securely verifying state
  useEffect(() => {
    if (order && order.items && approvalItems.length === 0) {
      const initialized = order.items.map(item => {
        const ordered = Number(item.orderedQty || item.quantity || 0);
        const approved = Number(item.approvedQty || 0);
        const pending = item.pendingQty !== undefined ? Number(item.pendingQty) : (ordered - approved);

        return {
          product_id: item.product_id || item.id,
          productName: item.productName || item.name || item.product_id,
          orderedQty: ordered,
          pendingQty: pending,
          approvedQty: approved,
          maxProduce: Number(item.maxProduce || 0),
          approveDelta: '', // Let user type explicitly
          freeItems: Array.isArray(item.freeItems) ? item.freeItems.map(f => ({
            product_id: f.product_id || '',
            quantity: Number(f.quantity || 1)
          })) : []
        };
      }).filter(item => {
        const isEditableState = order.status === 'PENDING' || order.status === 'PARTIALLY_APPROVED' || order.status === 'PARTIAL';
        return isEditableState ? item.pendingQty > 0 : true;
      });
      setApprovalItems(initialized);
    }
  }, [order]);

  const handleDeltaChange = (idx, value) => {
    const val = value === '' ? '' : Number(value);
    const newItems = [...approvalItems];
    
    // Hard constraint limits
    if (val !== '' && val < 0) return;
    if (val !== '' && val > newItems[idx].pendingQty) return;
    
    newItems[idx].approveDelta = val;
    setApprovalItems(newItems);
  };

  const addFreeItem = (idx) => {
    const newItems = [...approvalItems];
    newItems[idx].freeItems.push({ product_id: '', quantity: 1 });
    setApprovalItems(newItems);
  };

  const updateFreeItem = (itemIdx, freeIdx, field, val) => {
    const newItems = [...approvalItems];
    newItems[itemIdx].freeItems[freeIdx][field] = val;
    setApprovalItems(newItems);
  };

  const removeFreeItem = (itemIdx, freeIdx) => {
    const newItems = [...approvalItems];
    newItems[itemIdx].freeItems.splice(freeIdx, 1);
    setApprovalItems(newItems);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const approvedItemsPayload = approvalItems
        .filter(item => item.approveDelta !== '' && Number(item.approveDelta) > 0)
        .map(item => ({
          product_id: item.product_id,
          approveDelta: Number(item.approveDelta),
          // Clean up free items array recursively removing empties
          freeItems: item.freeItems.filter(f => f.product_id && Number(f.quantity) > 0).map(f => ({
            product_id: f.product_id,
            quantity: Number(f.quantity)
          }))
        }));

      if (approvedItemsPayload.length === 0) {
        throw new Error('You must assign an approveDelta > 0 for at least one item.');
      }

      const payload = {
        outletId: order.outletId || 'Unknown',
        approvedItems: approvedItemsPayload
      };

      await approveOrder(id, payload);
      
      setSuccessMsg('Order approval processed successfully!');
      
      // Delay brief then fall back uniformly
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Approval processing failed.');
      setIsSubmitting(false); // only re-enable on failure
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) {
      setError('Please provide remarks explaining the rejection.');
      setIsRejectModalOpen(false);
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    setIsRejectModalOpen(false);

    try {
      const payload = {
        outletId: order.outletId || 'Unknown',
        remarks: rejectRemarks
      };

      await rejectOrder(id, payload);
      
      setSuccessMsg('Order has been completely rejected successfully.');
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject order.');
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error && !order) return <ErrorState error={error} />;
  if (!order) return <ErrorState error="Critical data missing." />;

  const isEditable = order.status === 'PENDING' || order.status === 'PARTIALLY_APPROVED' || order.status === 'PARTIAL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0 }}>Approval Workspace: Order {order.orderId || order.id}</h2>
        <Badge status={order.status} />
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {successMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--color-green)', color: 'white', borderRadius: '4px' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>
        <Card style={{ alignSelf: 'start' }}>
          <CardHeader title="Order Metadata" />
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span className="text-muted">Outlet ID:</span>
              <div className="font-semibold">{order.outletId}</div>
            </div>
            <div>
              <span className="text-muted">Date Logged:</span>
              <div className="font-semibold">{order.createdAt || 'N/A'}</div>
            </div>
            {order.status !== 'PENDING' && (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
                Note: Orders no longer pending may already possess fulfilled partial elements constraint checking.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Dynamic Iterative Approval" />
          <CardContent style={{ padding: 0 }}>
            {/* Custom Table Interface */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                    <th style={{ padding: '1rem' }}>Product Name</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Ordered / Pending</th>
                    {isEditable && <th style={{ padding: '1rem', textAlign: 'center' }}>Approve Qty</th>}
                    <th style={{ padding: '1rem' }}>Free Items</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div className="font-semibold">{item.productName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {item.product_id}</div>
                        {item.maxProduce !== undefined && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Max Production: {item.maxProduce}</div>
                        )}
                      </td>
                      
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div><strong>{item.orderedQty}</strong> initially</div>
                        <div style={{ color: 'var(--color-red)' }}><strong>{item.pendingQty}</strong> pending</div>
                        {item.approvedQty > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--color-green)' }}>({item.approvedQty} previously approved)</div>}
                      </td>

                      {isEditable && (
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            min="0" 
                            max={item.pendingQty}
                            value={item.approveDelta}
                            onChange={(e) => handleDeltaChange(idx, e.target.value)}
                            disabled={isSubmitting || item.pendingQty === 0 || !isEditable}
                            style={{
                              width: '80px',
                              padding: '0.5rem',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              textAlign: 'center',
                              fontFamily: 'inherit',
                              borderColor: item.approveDelta > 0 ? 'var(--color-primary)' : ''
                            }}
                            placeholder="0"
                          />
                        </td>
                      )}

                      <td style={{ padding: '1rem' }}>
                        {item.freeItems.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {item.freeItems.map((fItem, fIdx) => (
                              <div key={fIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--color-background)', padding: '0.5rem', borderRadius: '4px' }}>
                                <Select 
                                  options={productOptions}
                                  value={fItem.product_id}
                                  onChange={(e) => updateFreeItem(idx, fIdx, 'product_id', e.target.value)}
                                  disabled={isSubmitting || !isEditable}
                                />
                                <Input 
                                  type="number" 
                                  min="1" 
                                  value={fItem.quantity}
                                  onChange={(e) => updateFreeItem(idx, fIdx, 'quantity', e.target.value)}
                                  disabled={isSubmitting || !isEditable}
                                />
                                <button 
                                  onClick={() => removeFreeItem(idx, fIdx)}
                                  // Minimalize visual clutter
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)' }}
                                  disabled={isSubmitting || !isEditable}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {isEditable && (
                          <Button 
                            variant="secondary" 
                            onClick={() => addFreeItem(idx)}
                            disabled={isSubmitting || item.pendingQty === 0}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Plus size={14} /> Add Free Item
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {approvalItems.length === 0 && (
                    <tr>
                      <td colSpan={isEditable ? "4" : "3"} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No items tracked.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          {isEditable && (
            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-secondary)' }}>
              <Button 
                variant="danger" 
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isSubmitting}
              >
                Reject Entire Order
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubmit}
                disabled={isSubmitting || approvalItems.length === 0 || approvalItems.every(i => i.approveDelta === '' || i.approveDelta <= 0)}
                style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
              >
                {isSubmitting ? 'Transmitting...' : 'Submit Approval Modifications'}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Modal 
        isOpen={isRejectModalOpen} 
        onClose={() => setIsRejectModalOpen(false)}
        title="Confirm Order Rejection"
      >
        <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          Are you truly sure you want to officially reject order <strong>{order.orderId || order.id}</strong>? If an order is partially processed, rejecting it will halt further production mapping.
        </p>
        <Input 
          label="Rejection Remarks (Required)"
          placeholder="e.g. Out of stock, invalid request..."
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReject} disabled={!rejectRemarks.trim()}>Confirm Rejection</Button>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetails;
