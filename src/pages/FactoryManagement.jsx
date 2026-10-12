import FactoryPendingPayments from './FactoryPendingPayments';
import React, {useCallback, useEffect, useState} from 'react';
import {Factory, RefreshCw} from 'lucide-react';
import {fetchFactoryManagement, fetchOutlets, dispatchFactoryCustomer} from '../api/manager';
import {Button} from '../components/ui/Button';
import {Card, CardContent, CardHeader} from '../components/ui/Card';
import {Select, Input} from '../components/ui/Input';
import {Modal} from '../components/ui/Modal';
import {Table} from '../components/ui/Table';
import {LoadingState, ErrorState} from '../components/ui/StateContainers';
import OrderProduct from '../components/OrderProduct';
import {outletLabel} from '../utils/outlets';

export default function FactoryManagement() {
  const [orders,setOrders]=useState([]), [outlets,setOutlets]=useState([]);
  const [outletId,setOutletId]=useState(''), [tab,setTab]=useState('PENDING');
  const [loading,setLoading]=useState(true), [error,setError]=useState('');
  const [selected,setSelected]=useState(null), [quantities,setQuantities]=useState({});
  const [dispatchId,setDispatchId]=useState(''), [saving,setSaving]=useState(false), [dispatchError,setDispatchError]=useState('');
  const load=useCallback(async () => {
    setLoading(true);setError('');
    try {const response=await fetchFactoryManagement(outletId);setOrders(response.orders || []);}
    catch (err) {setOrders([]);setError(err.response?.data?.error || 'Unable to load direct customer orders.');}
    finally {setLoading(false);}
  },[outletId]);
  useEffect(() => {load();},[load]);
  useEffect(() => {fetchOutlets().then(data => setOutlets((data.outlets || []).filter(outlet => String(outlet.outletId).toUpperCase().startsWith('NIM')))).catch(() => setOutlets([]));},[]);
  const open = order => {
    setSelected(order);setDispatchError('');setDispatchId(crypto.randomUUID());
    setQuantities(Object.fromEntries((order.items || []).map(item => [item.product_id, String(Number(item.orderedQty)-Number(item.dispatchedQty || 0))])));
  };
  const dispatch = async () => {
    const items = (selected.items || []).map(item => ({productId:item.product_id,quantity:Number(quantities[item.product_id] || 0)}));
    if (items.some(item => !Number.isInteger(item.quantity) || item.quantity < 0) || !items.some(item => item.quantity > 0)) {setDispatchError('Enter at least one positive whole dispatch quantity.');return;}
    setSaving(true);setDispatchError('');
    try {await dispatchFactoryCustomer(selected.orderId,{outletId:selected.outletId,dispatchId,items:items.filter(item => item.quantity>0)});setSelected(null);await load();}
    catch(err) {setDispatchError(err.response?.data?.error || 'Unable to record dispatch.');}
    finally {setSaving(false);}
  };
  const columns=[
    {key:'displayId',label:'Factory customer order',render:row => row.displayId || row.orderId},
    {key:'outletId',label:'Own outlet',render:row => outletLabel(row.outletId,outlets)},
    {key:'customerName',label:'Customer',render:row => <><strong>{row.customerName || 'Not recorded'}</strong><br />{row.customerPhone}<br />{row.customerAddress}</>},
    {key:'createdByName',label:'Sales person'},
    {key:'items',label:'Products / Complimentary',render:row => <div style={{display:'grid',gap:'0.75rem'}}>{(row.items || []).map((item,index) => <div key={index}><OrderProduct item={item} /><small>Dispatched {item.dispatchedQty || 0} / {item.orderedQty}</small></div>)}</div>},
    {key:'dispatchDate',label:'Dispatch date',render:row => row.dispatchDate || 'Not recorded'},
    {key:'status',label:'Status',render:row => ({PENDING:'Awaiting factory dispatch',PARTIALLY_DISPATCHED:'Partially dispatched',DISPATCHED:'Dispatched to customer'})[row.status] || row.status},
    {key:'actions',label:'Action',render:row => <Button variant="secondary" onClick={() => open(row)}>{row.status === 'DISPATCHED' ? 'View details / history' : 'View / Dispatch to customer'}</Button>},
  ];
  return <div style={{display:'grid',gap:'1.5rem'}}>
    <Card><CardHeader title="Factory Management" action={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</Button>} /><CardContent>
      <p><Factory size={18} /> Own outlet → Factory → Customer</p>
      <p>NIM factory-delivery sales appear here for direct customer dispatch. Outlet stock stays unchanged.</p>
      <Select label="Own outlet" value={outletId} onChange={event => setOutletId(event.target.value)} options={[{value:'',label:'All own outlets'},...outlets.map(outlet => ({value:outlet.outletId,label:outletLabel(outlet.outletId,outlets)}))]} />
    </CardContent></Card>
    <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>{[['PENDING','Awaiting dispatch'],['PARTIALLY_DISPATCHED','Partial dispatch'],['DISPATCHED','Dispatched to customer'],['PAYMENTS','Pending Payments']].map(([id,label]) => <Button key={id} variant={tab===id ? 'primary':'secondary'} onClick={() => setTab(id)}>{label}{id!=='PAYMENTS' && ` (${orders.filter(order=>order.status===id).length})`}</Button>)}</div>
    {tab==='PAYMENTS' ? <FactoryPendingPayments /> : loading ? <LoadingState message="Loading direct customer orders…" /> : error ? <ErrorState error={error} onRetry={load} /> : <Card><CardContent><Table columns={columns} data={orders.filter(order=>order.status===tab)} emptyStateMessage="No direct customer orders in this stage." /></CardContent></Card>}
    <Modal isOpen={Boolean(selected)} onClose={() => !saving && setSelected(null)} title={`Factory → Customer · ${selected?.displayId || ''}`}>
      {selected && <div style={{display:'grid',gap:'1rem'}}>
        <strong>{selected.customerName} · {selected.customerPhone}</strong><p>{selected.customerAddress}</p>
        <p>Outlet: {outletLabel(selected.outletId,outlets)} · Dispatch date: {selected.dispatchDate}</p>
        {(selected.items || []).map(item => <div key={item.product_id}><OrderProduct item={item} /><p>Ordered {item.orderedQty} · Dispatched {item.dispatchedQty || 0} · Remaining {Number(item.orderedQty)-Number(item.dispatchedQty || 0)}</p>{selected.status !== 'DISPATCHED' && <Input label="Quantity to dispatch to customer now" type="number" min="0" step="1" max={Number(item.orderedQty)-Number(item.dispatchedQty || 0)} value={quantities[item.product_id] || '0'} onChange={e=>setQuantities({...quantities,[item.product_id]:e.target.value})} disabled={saving} />}</div>)}
        {dispatchError && <p role="alert">{dispatchError}</p>}
        {selected.status !== 'DISPATCHED' && <Button onClick={dispatch} disabled={saving}>{saving ? 'Recording…':'Confirm factory dispatch to customer'}</Button>}
        <h4>Dispatch history</h4>
        {(selected.dispatchHistory || []).map(event=><div key={event.dispatchId}><strong>{event.dispatchId}</strong><br />{event.dispatchedAt} · {event.dispatchedBy}<br />{event.items.map(item=>`${(selected.items || []).find(product=>product.product_id===item.productId)?.productName || item.productId}: ${item.quantity}`).join(', ')}</div>)}
      </div>}
    </Modal>
  </div>;
}
