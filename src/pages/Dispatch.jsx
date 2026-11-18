import {dispatchGroups,dispatchGroupLabel} from '../utils/dispatchGroups';
import './Orders.css';
import {orderContents} from '../utils/orderContents';
import OrderContentsColumn,{OrderContentsColumns} from '../components/OrderContentsColumn';
import VehicleLoads from '../components/VehicleLoads';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { fetchDispatchedLoadPlans, fetchDispatchHistory, fetchOutlets, downloadDispatchedLoadPlansExcel } from '../api/manager';
import { outletLabel } from '../utils/outlets';
import { LoadingState, ErrorState } from '../components/ui/StateContainers';
import './Dispatch.css';
import UndoPlanButton from '../components/UndoPlanButton';

const Dispatch = () => {
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [historyTab, setHistoryTab] = useState('BATCHES');
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
      const [response, history] = await Promise.all([fetchDispatchedLoadPlans(), fetchDispatchHistory()]);
      const plans = Array.isArray(response) ? response : (response.loadPlans || []);
      const plansById = new Map(plans.map(plan => [plan.loadPlanId, plan]));
      setBatches((history.dispatches || []).map(batch => ({ ...batch, planDisplayId: plansById.get(batch.loadPlanId)?.displayId })));
      setOrders(plans);
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

  const batchReference = row => `DSP-${row.dispatchId?.slice(0, 8).toUpperCase() || '—'}`;
  const showBatchDetails = row => setDetailsPlan({ ...row, isBatch: true,
    displayId: row.planDisplayId || row.loadPlanId,
    items: [{ ...row, productName: row.productName, product_id: row.productId, quantity: row.quantity }],
  });
  const outletOptions = [
    { value: 'ALL', label: 'All outlets' },
    ...outlets.map((outlet) => ({ value: outlet.outletId, label: `${outlet.outletId}${outlet.outletName || outlet.username ? ` — ${outlet.outletName || outlet.username}` : ''}` })),
  ];
  const visibleOrders = selectedOutletId === 'ALL'
    ? orders
    : orders.filter((order) => order.outletId === selectedOutletId);

  const outletBatches = batches.filter(row => selectedOutletId === 'ALL' || row.outletId === selectedOutletId);
  const pendingBatches = outletBatches.filter(row => row.dispatchOrigin === 'PENDING');
  const visibleBatches = historyTab === 'PENDING' ? pendingBatches : outletBatches;
  const historyGroups=dispatchGroups(historyTab==='PLANS'?visibleOrders:visibleBatches);

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
    <>
    <VehicleLoads history/>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dispatch-toolbar">
        <div>
          <h2>Dispatch History & Logistics</h2>
          <p>View completed load plans and each separately recorded dispatch batch.</p>
        </div>
        <div className="dispatch-toolbar-actions">
          <Select label="Outlet" value={selectedOutletId} onChange={handleOutletChange} options={outletOptions} />
          <Button variant="secondary" onClick={loadDispatchedHistory} disabled={loading}>Refresh</Button>
          {historyTab === 'PLANS' && <Button variant="secondary" onClick={handleDownloadExcel} disabled={isDownloading || loading || orders.length === 0}>
            {isDownloading ? 'Downloading...' : 'Export to Excel'}
          </Button>}
        </div>
      </div>
      <div className="dispatch-history-tabs" aria-label="Dispatch history views">
        {[['BATCHES', 'Dispatches', outletBatches.length], ['PENDING', 'From Dispatch Pending', pendingBatches.length], ['PLANS', 'Load plan totals', visibleOrders.length]].map(([value, label, count]) =>
          <button key={value} type="button" className={historyTab === value ? 'active' : ''} aria-pressed={historyTab === value} onClick={() => setHistoryTab(value)}>{label}<span>{count}</span></button>
        )}
      </div>
      {historyTab !== 'PLANS' && <p className="dispatch-history-note">Dispatch batches are grouped by vehicle load or their original load plan. Open a batch to review the quantities sent.</p>}
      <Card>
        <CardHeader title={historyTab === 'PLANS' ? 'Completed load plans' : historyTab === 'PENDING' ? 'Shipments completed from Dispatch Pending' : 'Individual dispatch batches'} />
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={loadDispatchedHistory} />
        ) : (
          <CardContent style={{ padding: 0 }}>
            <div className="order-summary-list dispatch-history-groups">
              {!historyGroups.length && <p className="order-list-empty">No dispatch records found for this selection.</p>}
              {historyGroups.map(group=><section className="dispatch-history-load" key={group.key}>
                <h3>{dispatchGroupLabel(group.rows[0])}</h3>
                {group.rows.map((row,index)=>{
                  const items=historyTab==='PLANS'?(row.items || []):[{...row,product_id:row.productId}],contents=orderContents(items);
                  return <article className="order-summary-card" key={row.dispatchId || `${row.loadPlanId}-${index}`}>
                    <div className="order-summary-heading"><div><strong className="order-summary-reference">{historyTab==='PLANS'?(row.orderDisplayId || '—'):batchReference(row)}</strong><span className="order-summary-outlet">{outletLabel(row.outletId,outlets)}</span></div><Badge status="DISPATCHED"/></div>
                    <div className="order-summary-meta"><span>Order {row.orderDisplayId || row.orderId}</span><span>{row.dispatchedAt?new Date(row.dispatchedAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'Dispatch date not recorded'}</span><span>Dispatched by {row.dispatchedBy || 'Not recorded'}</span>{historyTab!=='PLANS'&&<span>{row.sourceType==='FACTORY'?'Factory':`Godown · ${row.sourceLocationId || '—'}`} · {row.dispatchOrigin==='PENDING'?'From Dispatch Pending':'Original dispatch'}</span>}</div>
                    <div className="order-summary-bottom"><div className="order-summary-counts"><span><strong>{contents.productTotal}</strong> ordered products sent</span><span><strong>{contents.complimentaryTotal}</strong> complimentary sent</span></div><div className="dispatch-history-actions"><Button variant="secondary" onClick={()=>historyTab==='PLANS'?setDetailsPlan(row):showBatchDetails(row)}>View details</Button>{historyTab==='PLANS'&&<UndoPlanButton plan={row} action="dispatch" onUndone={loadDispatchedHistory}/>}</div></div>
                    <details className="order-summary-details"><summary>View products and complimentary items</summary><div className="order-summary-contents"><section><h3>Products ordered</h3><OrderContentsColumn items={items}/></section><section><h3>Complimentary products</h3><OrderContentsColumn items={items} complimentary/></section></div></details>
                  </article>;
                })}
              </section>)}
            </div>
          </CardContent>
        )}
      </Card>

      <Modal
        isOpen={Boolean(detailsPlan)}
        onClose={() => setDetailsPlan(null)}
        title={detailsPlan?.isBatch ? `Dispatch ${batchReference(detailsPlan)}` : `Load plan total · ${detailsPlan?.orderDisplayId || '—'}`}
      >
        <div className="dispatch-detail-summary">
          {detailsPlan?.isBatch && <><div><span>Dispatch ID</span><strong title={detailsPlan.dispatchId}>{batchReference(detailsPlan)}</strong></div><div><span>Order</span><strong>{detailsPlan.orderDisplayId || detailsPlan.orderId}</strong></div></>}
          <div><span>Outlet</span><strong>{outletLabel(detailsPlan?.outletId, outlets)}</strong></div>
          <div><span>Load plan</span><strong>{detailsPlan?.displayId || '—'}</strong></div>
          <div><span>Dispatched</span><strong>{detailsPlan?.dispatchedAt ? new Date(detailsPlan.dispatchedAt).toLocaleString() : '—'}</strong></div>
          <div><span>Dispatched by</span><strong>{detailsPlan?.dispatchedBy || '—'}</strong></div>
        </div>
        <div className="dispatch-detail-items">
          <h4>Products dispatched</h4>
          <OrderContentsColumns items={detailsPlan?.items || []}/>
        </div>
      </Modal>
    </div>
    </>
  );
};

export default Dispatch;
