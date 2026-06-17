import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { fetchLoadPlans, dispatchLoadPlan, downloadLoadPlansExcel } from '../api/manager';

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
    } catch (err) {
      setError('Failed to download the Excel representation. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const columns = [
    { key: 'orderId', label: 'Order ID' },
    { key: 'loadPlanId', label: 'Load Plan ID', render: (row) => row.loadPlanId || '-' },
    { key: 'outletId', label: 'Outlet' },
    { key: 'productName', label: 'Product Name', render: (row) => row.productName || (row.items && row.items[0]?.productName) || 'Multiple' },
    { key: 'quantity', label: 'Quantity', align: 'center', render: (row) => row.quantity || (row.items && row.items[0]?.quantity) || '-' },
    { key: 'maxProduce', label: 'Max Capacity', align: 'center', render: (row) => row.maxProduce || '-' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'actions', label: 'Actions', align: 'right', render: (row) => (
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {activeTab === 'APPROVED' ? (
          <Button 
            variant="primary" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => handleDispatchPrompt(row)}
          >
            Mark as Dispatched
          </Button>
        ) : (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>-</span>
        )}
      </div>
    )}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Production Load Plans</h2>
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
