import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import { fetchLoadPlans, downloadLoadPlansExcel, fetchOutlets } from '../api/manager';
import { outletLabel } from '../utils/outlets';
import QRUnitDispatch from './QRUnitDispatch';
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
  const [detailsPlan, setDetailsPlan] = useState(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState(() => sessionStorage.getItem('managerLogisticsOutletId') || 'ALL');

  useEffect(() => {
    let isMounted = true;
    fetchOutlets().then((response) => {
      if (isMounted) setOutlets(response?.outlets || []);
    }).catch(() => {
      if (isMounted) setOutlets([]);
    });
    return () => { isMounted = false; };
  }, []);

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
    setSuccessMsg(null);
    setModalOpen(true);
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
    { key: 'outletId', label: 'Outlet', className: 'outlet-column', render: (row) => outletLabel(row.outletId, outlets) },
    { key: 'productName', label: 'Product', className: 'product-column', render: (row) => row.productName || (row.items && row.items[0]?.productName) || 'Multiple products' },
    { key: 'quantity', label: 'Qty', className: 'quantity-column', align: 'center', render: (row) => row.quantity ?? (row.items && row.items[0]?.quantity) ?? '—' },
    { key: 'maxProduce', label: 'Capacity', className: 'capacity-column', align: 'center', render: (row) => row.maxProduce ?? '—' },
    { key: 'createdAt', label: 'Created', className: 'created-column', render: (row) => <span title={row.createdAt}>{formatDateTime(row.createdAt)}</span> },
    { key: 'actions', label: 'Action', className: 'action-column', align: 'right', render: (row) => (
      <div className="load-plan-actions">
        <Button
          variant="secondary"
          className="view-plan-button"
          onClick={() => setDetailsPlan(row)}
        >
          View
        </Button>
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

  const outletOptions = [
    { value: 'ALL', label: 'All outlets' },
    ...outlets.map((outlet) => ({ value: outlet.outletId, label: `${outlet.outletId}${outlet.outletName || outlet.username ? ` — ${outlet.outletName || outlet.username}` : ''}` })),
  ];
  const visiblePlans = selectedOutletId === 'ALL'
    ? plans
    : plans.filter((plan) => plan.outletId === selectedOutletId);

  const handleOutletChange = (event) => {
    const outletId = event.target.value;
    setSelectedOutletId(outletId);
    sessionStorage.setItem('managerLogisticsOutletId', outletId);
  };

  return (
    <div className="load-plans-page">
      <div className="load-plans-toolbar">
        <div>
          <h2>Production Load Plans</h2>
          <p>Scan the QR label on every physical unit for an approved plan. The plan is dispatched only when all planned quantities are scanned.</p>
        </div>
        <div className="load-plan-toolbar-actions">
          <Select
            label="Outlet"
            value={selectedOutletId}
            onChange={handleOutletChange}
            options={outletOptions}
          />
          <Button
            variant="secondary"
            onClick={handleDownloadExcel}
            disabled={isDownloading || loading || plans.length === 0}
          >
            {isDownloading ? 'Downloading...' : 'Export to Excel'}
          </Button>
        </div>
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
              data={visiblePlans}
              className="load-plans-table"
              emptyStateMessage={selectedOutletId === 'ALL'
                ? `No load plans found for ${activeTab.toLowerCase()} status.`
                : `No ${activeTab.toLowerCase()} load plans found for ${selectedOutletId}.`}
            />
          </CardContent>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Scan QR units to dispatch this load plan"
      >
        <QRUnitDispatch
          loadPlan={selectedPlan}
          onDispatched={(result) => {
            const planId = selectedPlan?.loadPlanId || selectedPlan?.id;
            if (!result?.load_plan_dispatched) return;
            setPlans((current) => current.filter((plan) => (plan.loadPlanId || plan.id) !== planId));
            setSuccessMsg(`Plan ${selectedPlan?.displayId || compactId(planId)} marked as dispatched successfully.`);
            setModalOpen(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={Boolean(detailsPlan)}
        onClose={() => setDetailsPlan(null)}
        title={`Load Plan ${detailsPlan?.displayId || compactId(detailsPlan?.loadPlanId)}`}
      >
        <div className="load-plan-detail-summary">
          <div><span>Outlet</span><strong>{outletLabel(detailsPlan?.outletId, outlets)}</strong></div>
          <div><span>Order reference</span><strong>{detailsPlan?.orderDisplayId || compactId(detailsPlan?.orderId)}</strong></div>
          <div><span>Created</span><strong>{formatDateTime(detailsPlan?.createdAt)}</strong></div>
          <div><span>Status</span><strong>{detailsPlan?.planType || activeTab}</strong></div>
        </div>
        <div className="load-plan-detail-items">
          <h4>Items in this load plan</h4>
          <Table
            columns={[
              { key: 'productName', label: 'Product', render: (item) => item.productName || item.product_id || '—' },
              { key: 'quantity', label: 'Quantity', align: 'center', render: (item) => item.quantity ?? '—' },
              { key: 'maxProduce', label: 'Capacity', align: 'center', render: (item) => item.maxProduce ?? '—' },
              { key: 'isFree', label: 'Type', render: (item) => item.isFree ? 'Free item' : 'Ordered item' },
            ]}
            data={detailsPlan?.items || []}
            emptyStateMessage="This load plan has no items."
          />
        </div>
      </Modal>
    </div>
  );
};

export default LoadPlans;
