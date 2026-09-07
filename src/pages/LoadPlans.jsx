import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { fetchLoadPlans, dispatchLoadPlan, downloadLoadPlansExcel } from '../api/manager';
import './LoadPlans.css';

const compactId = (value) => {
  if (!value) return '—';
  const text = String(value);
  return text.length > 18 ? `${text.slice(0, 8)}…${text.slice(-6)}` : text;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const LoadPlans = () => {
  const [activeTab, setActiveTab] = useState('APPROVED'); // APPROVED or PENDING
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState(null);

  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchLoadPlans(activeTab);
        if (isMounted) {
          // Flatten items recursively or assume the endpoint returns an array of structured mappings
          setPlans(Array.isArray(response) ? response : (response.loadPlans || response.data || []));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to fetch load plans.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [activeTab]);

  const handleDispatchPrompt = (plan) => {
    setSelectedPlan(plan);
    setDispatchError(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedPlan) return;
    
    setIsDispatching(true);
    setDispatchError(null);
    
    try {
      const planId = selectedPlan.loadPlanId || selectedPlan.id || selectedPlan.orderId;
      const payload = {
        orderId: selectedPlan.orderId || selectedPlan.id || 'Unknown',
        dispatchedAt: new Date().toISOString()
      };
      
      await dispatchLoadPlan(planId, payload);
      
      setSuccessMsg(`Plan ${planId} marked as dispatched successfully!`);
      
      setPlans(plans.filter(p => (p.loadPlanId || p.id || p.orderId) !== planId));
      setModalOpen(false);
    } catch (err) {
      setDispatchError(err.response?.data?.message || err.message || 'Dispatch modification failed.');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const blob = await downloadLoadPlansExcel(activeTab);
      // Create secure object URL from the raw blob
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      const tzOffset = new Date().getTimezoneOffset() * 60000;
      const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
      link.setAttribute('download', `${activeTab.toLowerCase()}_load_plans_${localISOTime}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup DOM
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download the Excel representation. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const columns = [
    { key: 'orderDisplayId', label: 'Order Ref', className: 'id-column', render: (row) => <span title={row.orderId}>{row.orderDisplayId || '—'}</span> },
    { key: 'displayId', label: 'Plan Ref', className: 'id-column', render: (row) => <span title={row.loadPlanId}>{row.displayId || compactId(row.loadPlanId)}</span> },
    { key: 'outletId', label: 'Outlet', className: 'outlet-column', render: (row) => row.outletId || '—' },
    { key: 'productName', label: 'Product', className: 'product-column', render: (row) => row.productName || (row.items && row.items[0]?.productName) || 'Multiple products' },
    { key: 'quantity', label: 'Qty', className: 'quantity-column', align: 'center', render: (row) => row.quantity ?? (row.items && row.items[0]?.quantity) ?? '—' },
    { key: 'maxProduce', label: 'Capacity', className: 'capacity-column', align: 'center', render: (row) => row.maxProduce ?? '—' },
    { key: 'createdAt', label: 'Created', className: 'created-column', render: (row) => <span title={row.createdAt}>{formatDateTime(row.createdAt)}</span> },
    { key: 'actions', label: 'Action', className: 'action-column', align: 'right', render: (row) => (
      <div className="load-plan-actions">
        {activeTab === 'APPROVED' ? (
          <Button 
            variant="primary" 
            className="dispatch-button"
            onClick={() => handleDispatchPrompt(row)}
          >
            Dispatch
          </Button>
        ) : (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>-</span>
        )}
      </div>
    )}
  ];

  return (
    <div className="load-plans-page">
      <div className="load-plans-toolbar">
        <div>
          <h2>Production Load Plans</h2>
          <p>Review approved production plans and dispatch them to outlets.</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleDownloadExcel} 
          disabled={isDownloading || loading || plans.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isDownloading ? 'Downloading...' : 'Export to Excel'}
        </Button>
      </div>

      {successMsg && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-green)', color: 'white', borderRadius: '4px' }}>
          {successMsg}
        </div>
      )}

      <Card>
        <CardHeader 
          action={
            <div className="load-plan-tabs">
              <Button 
                variant={activeTab === 'APPROVED' ? 'primary' : 'secondary'} 
                onClick={() => setActiveTab('APPROVED')}
              >
                Production Ready (Approved)
              </Button>
              <Button 
                variant={activeTab === 'PENDING' ? 'primary' : 'secondary'} 
                onClick={() => setActiveTab('PENDING')}
              >
                Awaiting (Pending)
              </Button>
            </div>
          } 
        />
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={() => setActiveTab(activeTab)} />
        ) : (
          <CardContent style={{ padding: 0 }}>
            <Table 
              columns={columns} 
              data={plans} 
              className="load-plans-table"
              emptyStateMessage={`No load plans found for ${activeTab.toLowerCase()} status.`} 
            />
          </CardContent>
        )}
      </Card>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => !isDispatching && setModalOpen(false)} 
        title="Confirm Operational Dispatch"
      >
        <p style={{ marginTop: '0.5rem' }}>
          Are you sure you want to officially mark load plan/order <strong>{selectedPlan?.loadPlanId || selectedPlan?.orderId || selectedPlan?.id}</strong> as dispatched?
        </p>
        
        {dispatchError && (
          <div style={{ padding: '0.75rem', marginTop: '1rem', backgroundColor: 'var(--color-red)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>
            {dispatchError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button 
            variant="secondary" 
            onClick={() => setModalOpen(false)}
            disabled={isDispatching}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmDispatch}
            disabled={isDispatching}
          >
            {isDispatching ? 'Transmitting...' : 'Confirm Dispatch'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LoadPlans;
