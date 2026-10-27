import {factoryProductName} from '../utils/saleProductName';
import {factorySchemeDetails} from '../utils/factoryComplimentary';
import OwnSalesRecords from './OwnSalesRecords';
import AfterSales from './AfterSales';
import ProductMrp from '../components/ProductMrp';
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

function FactoryOrderProduct({order,item}) {
 const schemes=factorySchemeDetails(order,item);
 const specifications=(order.salesSpecifications || []).filter(spec=>String(spec.productId || spec.product_id || '')===String(item.product_id || item.productId || ''));
 const colours=specifications.filter(spec=>String(spec.colour || '').trim());
 return <div>{item.isComplimentary && <strong style={{color:'var(--color-primary)'}}>Complimentary · </strong>}<OrderProduct item={item} name={factoryProductName(order,item)}/>{colours.map((spec,index)=><div key={`colour-${index}`} style={{marginTop:'.25rem',whiteSpace:'normal'}}><strong>Colour:</strong> {spec.colour}{specifications.length>1 && <> · Qty: {spec.quantity}{spec.size && <> · Size: {spec.size}</>}</>}</div>)}{!colours.length && !item.isComplimentary && <div><strong>Colour:</strong> {item.colour || 'Not specified'}</div>}{schemes.length>0 && <section style={{marginTop:'.5rem',padding:'.65rem',border:'1px solid var(--color-primary)',borderRadius:'.5rem',whiteSpace:'normal'}}><strong style={{color:'var(--color-primary)'}}>Complimentary items / sale scheme</strong>{schemes.map((entry,index)=><div key={index} style={{marginTop:'.35rem'}}>{entry.scheme}{schemes.length>1 && <small style={{display:'block'}}>For sale line quantity: {entry.quantity}</small>}</div>)}</section>}</div>;
}

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
    setQuantities(Object.fromEntries((order.dispatchItems || order.items || []).map(item => [item.product_id, '0'])));
  };
  const dispatch = async () => {
    const items = (selected.dispatchItems || selected.items || []).map(item => ({productId:item.product_id,quantity:Number(quantities[item.product_id] || 0)}));
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
    {key:'items',label:'Products / Complimentary',render:row => <div style={{display:'grid',gap:'0.75rem'}}>{(row.dispatchItems || row.items || []).map((item,index) => <div key={index}><FactoryOrderProduct order={row} item={item}/><small>Dispatched {item.dispatchedQty || 0} / {item.orderedQty} · Pending {Number(item.orderedQty)-Number(item.dispatchedQty || 0)}</small></div>)}</div>},
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
    <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>{[['PENDING','Awaiting dispatch'],['PARTIALLY_DISPATCHED','Partial dispatch'],['DISPATCHED','Dispatched to customer'],['SALES_RECORDS','Sales Records'],['PAYMENTS','Pending Payments'],['AFTER_SALES','After-sales factory work']].map(([id,label]) => <Button key={id} variant={tab===id ? 'primary':'secondary'} onClick={() => setTab(id)}>{label}{!['PAYMENTS','AFTER_SALES','SALES_RECORDS'].includes(id) && ` (${orders.filter(order=>order.status===id).length})`}</Button>)}</div>
    {tab==='SALES_RECORDS' ? <OwnSalesRecords readOnly outletId={outletId} outlets={outlets}/> : tab==='AFTER_SALES' ? <AfterSales factoryMode /> : tab==='PAYMENTS' ? <FactoryPendingPayments readOnly /> : loading ? <LoadingState message="Loading direct customer orders…" /> : error ? <ErrorState error={error} onRetry={load} /> : <Card><CardContent><Table columns={columns} data={orders.filter(order=>order.status===tab)} emptyStateMessage="No direct customer orders in this stage." /></CardContent></Card>}
    <Modal isOpen={Boolean(selected)} onClose={() => !saving && setSelected(null)} title={`Factory → Customer · ${selected?.displayId || ''}`}>
      {selected && <div style={{display:'grid',gap:'1rem'}}>
        <strong>{selected.customerName} · {selected.customerPhone}</strong><p>{selected.customerAddress}</p>
        <p>Outlet: {outletLabel(selected.outletId,outlets)} · Dispatch date: {selected.dispatchDate}</p>
        <p>Enter only the quantities leaving now. Leave other items at zero; they remain pending.</p>
        {selected.unresolvedComplimentary?.length>0 && <p role="alert">Some saved scheme notes do not specify item quantities: {selected.unresolvedComplimentary.join('; ')}. These need confirmation before this order can be marked complete.</p>}
        {(selected.dispatchItems || selected.items || []).map(item => <div key={item.product_id}><FactoryOrderProduct order={selected} item={item}/><p>Ordered {item.orderedQty} · Dispatched {item.dispatchedQty || 0} · Remaining {Number(item.orderedQty)-Number(item.dispatchedQty || 0)}</p>{selected.status !== 'DISPATCHED' && Number(item.orderedQty)>Number(item.dispatchedQty || 0) && <Input label="Quantity to dispatch to customer now" type="number" min="0" step="1" max={Number(item.orderedQty)-Number(item.dispatchedQty || 0)} value={quantities[item.product_id] || '0'} onChange={e=>setQuantities({...quantities,[item.product_id]:e.target.value})} disabled={saving} />}</div>)}
        {dispatchError && <p role="alert">{dispatchError}</p>}
        {selected.status !== 'DISPATCHED' && <Button onClick={dispatch} disabled={saving}>{saving ? 'Recording…':'Confirm factory dispatch to customer'}</Button>}
        <h4>Dispatch history</h4>
        {(selected.dispatchHistory || []).map(event=><div key={event.dispatchId}><strong>{event.dispatchId}</strong><br />{event.dispatchedAt} · {event.dispatchedBy}<br />{(event.itemDetails || event.items).map((item,index)=><div key={index}>{item.isComplimentary?'Complimentary · ':''}{item.productName || factoryProductName(selected,(selected.dispatchItems || selected.items || []).find(product=>product.product_id===item.productId) || {productId:item.productId,productName:item.productId})}: {item.quantity}<ProductMrp item={item}/></div>)}</div>)}
      </div>}
    </Modal>
  </div>;
}
