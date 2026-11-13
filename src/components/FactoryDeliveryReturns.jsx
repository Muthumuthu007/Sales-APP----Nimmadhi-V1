import React, {useState} from 'react';
import {recordFactoryDelivery} from '../api/manager';
import {Button} from './ui/Button';
import {Modal} from './ui/Modal';
import './FactoryDeliveryReturns.css';

const labels={DELIVER:'Delivery confirmed (previous workflow)',FAIL:'Mark return',RECEIVE:'Receive returned items',REDISPATCH:'Redispatch reserved items',RELEASE_HOLD:'Release inspected items',HISTORY:'Delivery & return history'};
const totals=order=>order.delivery?.totals || {};
const count=(o,k)=>Number(totals(o)[k] || 0);
const locationLabel=c=>`${c.locationName} (${c.locationId})`;
export default function FactoryDeliveryReturns({orders,outlets,onRefresh,recordAction=recordFactoryDelivery,receivingLocationId=null}) {
 const [filter,setFilter]=useState('ALL'),[search,setSearch]=useState('');
 const [selected,setSelected]=useState(null),[action,setAction]=useState(''),[quantities,setQuantities]=useState({});
 const [location,setLocation]=useState(''),[reason,setReason]=useState('Customer unavailable'),[notes,setNotes]=useState(''),[date,setDate]=useState(''),[confirmed,setConfirmed]=useState(false);
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[pending,setPending]=useState(null);
 const open=(order,next)=>{setSelected(order);setAction(next);setQuantities({});setLocation(receivingLocationId || '');setReason('Customer unavailable');setNotes('');setDate('');setConfirmed(false);setError('');setPending(null);};
 const close=()=>{if(!saving){setSelected(null);if(pending)onRefresh();}};
 const products=selected?.delivery?.products || [];
 const localCount=(o,key)=>receivingLocationId&&['ready','held'].includes(key)?(o.delivery?.products || []).reduce((n,p)=>n+(p.custody || []).filter(c=>c.locationId===receivingLocationId).reduce((m,c)=>m+Number(c[key==='ready'?'good':'held'] || 0),0),0):count(o,key);
 const custodyLocations=[...new Map(products.flatMap(p=>p.custody || []).filter(c=>!receivingLocationId||c.locationId===receivingLocationId).map(c=>[c.locationId,c])).values()];
 const locations=action==='RECEIVE'?[...(!receivingLocationId?[{locationId:'FACTORY',locationName:'Factory'}]:[]),...outlets.map(o=>({locationId:o.outletId,locationName:o.outletName || o.outletId}))]:custodyLocations;
 const available=p=>action==='RECEIVE'?Number(p.expected):action==='REDISPATCH'||action==='RELEASE_HOLD'?Number(p.custody?.find(c=>c.locationId===location)?.[action==='REDISPATCH'?'good':'held'] || 0):Number(p.delivered);
 const submit=async e=>{
  e.preventDefault();setError('');let body=pending;
  if(!body){
   const items=products.map(p=>{const q=quantities[p.productId] || {};return action==='RECEIVE'?{productId:p.productId,good:Number(q.good || 0),held:Number(q.held || 0)}:{productId:p.productId,quantity:Number(q.quantity || 0)};}).filter(i=>action==='RECEIVE'?i.good||i.held:i.quantity);
   if(!items.length){setError('Enter a quantity for at least one product.');return;}
   if(items.some(i=>Object.entries(i).some(([k,v])=>k!=='productId'&&(!Number.isInteger(v)||v<0)))){setError('Enter positive whole quantities.');return;}
   body={eventId:crypto.randomUUID(),expectedVersion:selected.delivery.version,outletId:selected.outletId,action,items,locationId:location || null,reason:action==='FAIL'?reason:'',notes,deliveryDate:date || null,physicalConfirmed:['RECEIVE','RELEASE_HOLD'].includes(action)&&confirmed,customerConfirmed:action==='REDISPATCH'&&confirmed};
  }
  setPending(body);setSaving(true);
  try{await recordAction(selected.orderId,body);setSelected(null);setPending(null);setNotice(`${labels[action]} saved for ${selected.displayId}.`);await onRefresh();}
  catch(err){setError(err.response?.data?.error || 'The result is not confirmed. Retry the same action to check it safely.');if(err.response && [400,403,404,409].includes(err.response.status)){setPending(null);if(err.response.status===409){setSelected(null);setNotice('Order changed. Data refreshed; reopen the order and review its quantities.');await onRefresh();}}}
  finally{setSaving(false);}
 };
 const update=(id,key,value)=>setQuantities(q=>({...q,[id]:{...q[id],[key]:value}}));
 const dispatched=orders.filter(o=>(o.delivery?.products || []).some(p=>Number(p.trackedDispatchQty)>0));
 const returns=orders.filter(o=>['expected','ready','held'].some(k=>count(o,k)>0));
 const visible=orders.filter(o=>(filter==='ALL'?dispatched.includes(o):filter==='RETURNS'?returns.includes(o):localCount(o,filter)>0)&&`${o.displayId} ${o.customerName} ${o.customerPhone || ''}`.toLowerCase().includes(search.toLowerCase()));
 return <section className="factory-delivery">
 <div><h2>Delivery & returns</h2><p className="fd-muted">Dispatch counts as delivery. Record a return only when dispatched items come back.</p></div>
 <div className="fd-stats">{[['delivered','Dispatched / delivered'],['expected','Return expected'],['ready','Reserved for redelivery'],['held','Held for inspection']].map(([key,label])=><div key={key}><span>{label}</span><strong>{orders.reduce((n,o)=>n+localCount(o,key),0)}</strong><small>items</small></div>)}</div>
 <div className="fd-info">No delivery confirmation is needed. Mark a return only for the affected quantities, then confirm physical receipt. Returned items stay reserved for their original customer.</div>
 {receivingLocationId&&<p className="fd-info">You can receive and redispatch items at your outlet only. Factory Management handles returns at other locations.</p>}
 <div className="fd-tools"><label className="fd-search">Search orders or customers<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Order number, name, or phone"/></label><label>Stage<select value={filter} onChange={e=>setFilter(e.target.value)}>{[['ALL','All dispatched orders'],['RETURNS','Returns in progress'],['expected','Return expected'],['ready','Reserved for redelivery'],['held','Held for inspection']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div>
 {notice&&<p className="fd-info" role="status">{notice}</p>}
 {!visible.length&&<p className="fd-empty">No orders in this stage.</p>}
 {visible.map(o=><article className="fd-order" key={o.orderId}><div className="fd-order-head"><div><strong>{o.displayId || o.orderId}</strong><span className="fd-muted"> · {o.customerName || 'Customer not recorded'}</span><p className="fd-muted">{o.outletId} · {o.customerPhone} · {o.customerAddress}</p></div><Button variant="secondary" onClick={()=>open(o,'HISTORY')}>View history</Button></div>
 {(o.delivery?.products || []).filter(p=>p.trackedDispatchQty>0).map(p=><div className="fd-product" key={p.productId}><strong>{p.isComplimentary?'Complimentary · ':''}{p.productName}</strong><div className="fd-counts"><span>Dispatched / delivered <b>{p.delivered}</b></span><span>Return expected <b>{p.expected}</b></span></div>{p.custody?.filter(c=>Number(c.good)+Number(c.held)>0).map(c=><small className="fd-custody" key={c.locationId}>{locationLabel(c)} · {c.good} reserved · {c.held} held for inspection</small>)}</div>)}
 <div className="fd-actions">{count(o,'delivered')>0&&<Button variant="secondary" onClick={()=>open(o,'FAIL')}>Mark return</Button>}{count(o,'expected')>0&&<Button onClick={()=>open(o,'RECEIVE')}>Receive return</Button>}{localCount(o,'ready')>0&&<Button onClick={()=>open(o,'REDISPATCH')}>Redispatch</Button>}{localCount(o,'held')>0&&<Button variant="secondary" onClick={()=>open(o,'RELEASE_HOLD')}>Record inspection</Button>}</div></article>)}
 <Modal isOpen={Boolean(selected)} onClose={close} title={`${labels[action] || ''} · ${selected?.displayId || ''}`}>
 {selected&&(action==='HISTORY'?<div><p>{selected.customerName} · {selected.outletId}</p><div className="fd-info">Original factory dispatches are listed in the order's dispatch history. This timeline records return movements and redispatch. Dispatch counts as delivery.</div>{!selected.delivery.history.length&&<p>No returns recorded for this order.</p>}<ol className="fd-timeline">{selected.delivery.history.map(event=><li key={event.eventId}><strong>{labels[event.action]}</strong><p>{new Date(event.at).toLocaleString()} · {event.by}</p>{event.location&&<p>{locationLabel(event.location)}</p>}{event.deliveryDate&&<p>Delivery date: {event.deliveryDate}</p>}{event.reason&&<p>{event.reason}</p>}{event.items.map(i=><p key={i.productId}>{products.find(p=>p.productId===i.productId)?.productName || i.productId}: {event.action==='RECEIVE'?`${i.good || 0} good · ${i.held || 0} held`:i.quantity}</p>)}{event.notes&&<p>{event.notes}</p>}</li>)}</ol></div>:<form onSubmit={submit}>
 {error&&<div role="alert" className="fd-error">{error}</div>}
 <fieldset disabled={saving||Boolean(pending)} className="fd-fields">
 <p>{selected.customerName} · {selected.outletId}</p>
 <div className="fd-info">{action==='FAIL'?'Enter only the dispatched quantities coming back. The other quantities remain delivered; no confirmation is needed.':action==='RECEIVE'?'Confirm physical receipt. Good items are reserved for this order; damaged items are held and cannot be redispatched.':action==='REDISPATCH'?'Use only reserved good items at the selected location. This keeps the original bill and does not deduct fresh stock.':action==='RELEASE_HOLD'?'Confirm inspection is complete and these items are now in good condition. They remain reserved for this customer.':'Record the returned quantities.'}</div>
 {['RECEIVE','REDISPATCH','RELEASE_HOLD'].includes(action)&&<label>{action==='RECEIVE'?'Receiving location':'Reserved stock location'}<select value={location} onChange={e=>{setLocation(e.target.value);setQuantities({});}} required><option value="">{receivingLocationId?'Select your outlet':'Choose factory, godown, or outlet'}</option>{locations.map(c=><option key={c.locationId} value={c.locationId}>{locationLabel(c)}</option>)}</select></label>}
 {products.map(p=>available(p)>0&&<div className="fd-line" key={p.productId}><strong>{p.productName}</strong><p className="fd-muted">{available(p)} available for this action</p><div className="fd-quantity-grid">{(action==='RECEIVE'?['good','held']:['quantity']).map(key=><label key={key}>{key==='good'?'Received in good condition':key==='held'?'Damaged / needs inspection':'Quantity'}<input type="number" min="0" step="1" max={available(p)} value={quantities[p.productId]?.[key] || ''} onChange={e=>update(p.productId,key,e.target.value)} placeholder="0"/></label>)}</div></div>)}
 {action==='FAIL'&&<label>Reason<select value={reason} onChange={e=>setReason(e.target.value)} required>{['Customer unavailable','Address could not be located','Customer requested another date','Product damaged in transit','Other'].map(r=><option key={r}>{r}</option>)}</select></label>}
 {action==='REDISPATCH'&&<label>Delivery date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required min={new Date().toLocaleDateString('en-CA')}/></label>}
 <label>Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1500} required={action==='FAIL'&&reason==='Other'} placeholder="Condition, contact attempts, or delivery instructions"/></label>
 {['RECEIVE','REDISPATCH','RELEASE_HOLD'].includes(action)&&<label className="fd-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required/>{action==='REDISPATCH'?'The customer has confirmed availability.':action==='RELEASE_HOLD'?'Inspection is complete and these items are in good condition.':'I have physically received and checked these quantities at the selected location.'}</label>}
 </fieldset><div className="fd-actions"><Button type="button" variant="secondary" disabled={saving} onClick={close}>Close</Button><Button type="submit" disabled={saving}>{saving?'Saving…':pending?'Retry same action':labels[action]}</Button></div>
 </form>)}
 </Modal></section>;
}
