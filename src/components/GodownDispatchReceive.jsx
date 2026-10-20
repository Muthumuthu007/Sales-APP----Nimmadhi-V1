import React,{useEffect,useRef,useState} from 'react';
import api from '../api/axios';
import {Select} from './ui/Input';
import {Button} from './ui/Button';
import {Table} from './ui/Table';
export default function GodownDispatchReceive({outlets,onReceived}){
 const [destination,setDestination]=useState(''),[orders,setOrders]=useState([]),[selected,setSelected]=useState([]);
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const requestId=useRef(null);const sequence=useRef(0);
 const load=async(outlet=destination)=>{const generation=++sequence.current;setOrders([]);setSelected([]);setError('');if(!outlet)return;setLoading(true);try{const data=await api.get('/godown/custody/dispatches',{params:{destinationOutletId:outlet}});if(generation===sequence.current)setOrders(data.dispatchOrders || []);}catch(e){if(generation===sequence.current)setError(e.response?.data?.error || 'Unable to load factory dispatches.');}finally{if(generation===sequence.current)setLoading(false);}};
 useEffect(()=>()=>{sequence.current++;},[]);
 const toggle=ids=>{requestId.current=null;setNotice('');setSelected(current=>ids.every(id=>current.includes(id))?current.filter(id=>!ids.includes(id)):[...new Set([...current,...ids])]);};
 const items=orders.flatMap(order=>order.items).filter(item=>selected.includes(item.dispatchId));
 const receive=async()=>{setBusy(true);setError('');setNotice('');requestId.current ||= crypto.randomUUID();try{
  const result=await api.post('/godown/custody/dispatches',{destinationOutletId:destination,dispatchIds:selected,requestId:requestId.current});
  requestId.current=null;setNotice(`${result.quantity} units received into temporary stocks for this outlet. Godown own stock is unchanged.`);await load();onReceived?.();
 }catch(e){setError(e.response?.data?.error || 'Unable to confirm receipt. Retry with the same selection to safely check it.');}finally{setBusy(false);}};
 return <section style={{display:'grid',gap:16,margin:'20px 0'}}><h3>Receive from factory dispatch</h3><p>Choose the outlet these goods belong to, then select a dispatched order or its product lines. Only confirm goods physically arriving at this godown. Do not select goods already entered manually.</p>
 <Select label="Destination outlet" value={destination} disabled={busy} onChange={e=>{requestId.current=null;setDestination(e.target.value);setNotice('');load(e.target.value);}} options={[{value:'',label:'Select outlet…'},...outlets.map(o=>({value:o.outletId,label:`${o.outletName} (${o.outletId})`}))]}/>
 <Button variant="secondary" disabled={busy||loading||!destination} onClick={()=>load()}>Refresh factory dispatches</Button>
 {loading&&<p role="status">Loading factory dispatches…</p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!loading&&destination&&!orders.length&&!error&&<p>No eligible factory dispatches found for this outlet.</p>}
 {orders.map(order=><section key={`${order.orderId}-${order.loadPlanId}`} style={{padding:16,border:'1px solid var(--color-border)',borderRadius:12}}>
 <label><input type="checkbox" disabled={busy} checked={order.items.every(item=>selected.includes(item.dispatchId))} onChange={()=>toggle(order.items.map(item=>item.dispatchId))}/> Order {order.orderDisplayId} · Load plan {order.planDisplayId}</label>
 <Table columns={[{key:'selected',label:'Select',render:item=><input aria-label={`Select ${item.productName}`} type="checkbox" disabled={busy} checked={selected.includes(item.dispatchId)} onChange={()=>toggle([item.dispatchId])}/>},{key:'productName',label:'Product'},{key:'availableQuantity',label:'Quantity to store'},{key:'dispatchId',label:'Dispatch reference'},{key:'dispatchedAt',label:'Dispatched at',render:item=>new Date(item.dispatchedAt).toLocaleString()}]} data={order.items}/>
 </section>)}
 {selected.length>0&&<p><strong>{selected.length} dispatch lines · {items.reduce((sum,item)=>sum+Number(item.availableQuantity),0)} units</strong> will be held separately for the selected outlet.</p>}
 <Button disabled={busy||loading||!selected.length||selected.length>20} onClick={receive}>{busy?'Receiving…':'Confirm temporary receipt of selected goods'}</Button>
 {selected.length>20&&<p>Select no more than 20 dispatch lines per receipt.</p>}
 </section>;
}
