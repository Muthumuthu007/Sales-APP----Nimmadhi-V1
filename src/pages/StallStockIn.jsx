import React,{useCallback,useEffect,useState} from 'react';
import api from '../api/axios';
import {idempotentPost} from '../api/idempotent';
import {outletAvailableStock} from '../utils/salesStock';
import {Card,CardHeader,CardContent} from '../components/ui/Card';
import {Input,Select} from '../components/ui/Input';
import {Button} from '../components/ui/Button';
import {Table} from '../components/ui/Table';
export default function StallStockIn(){
 const [items,setItems]=useState([]);
 const [data,setData]=useState(null),[direction,setDirection]=useState('IN'),[product,setProduct]=useState(''),[quantity,setQuantity]=useState('1'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{try{setData(await api.get('/stall/stock'));setError('');}catch{setError('Unable to load linked stock. Please retry.');}},[]);
 useEffect(()=>{load();},[load]);
 const source=direction==='IN'?data?.outletStock:data?.stallStock;
 const available=pid=>outletAvailableStock(source || [],pid);
 const add=()=>{
  const qty=Number(quantity),row=(source || []).find(item=>item.productId===product);
  if(!row || !Number.isInteger(qty) || qty<1){setError('Choose a product and positive whole quantity.');return;}
  const existing=items.find(item=>item.productId===product);
  const combined=Number(existing?.quantity || 0)+qty;
  if(combined>available(product)){setError(`Only ${available(product)} units of ${row.productName || product} are available. Include quantities already in your list.`);return;}
  if(!existing && items.length>=24){setError('Receive up to 24 different products in one transfer.');return;}
  setItems(current=>existing?current.map(item=>item.productId===product?{...item,quantity:combined}:item):[...current,{productId:product,productName:row.productName || product,quantity:qty}]);
  setProduct('');setQuantity('1');setError('');setMessage('');
 };
 const submit=async()=>{
  if(!items.length){setError('Add at least one product to your transfer list.');return;}
  const invalid=items.find(item=>!Number.isInteger(Number(item.quantity)) || Number(item.quantity)<1 || Number(item.quantity)>available(item.productId));
  if(invalid){setError(`Check the quantity for ${invalid.productName}. Available: ${available(invalid.productId)}.`);return;}
  setBusy(true);setError('');setMessage('');
  try{
   const result=await idempotentPost(api,'/stall/stock',{direction,items:items.map(item=>({productId:item.productId,quantity:Number(item.quantity)}))});
   setMessage(`${items.length} products ${direction==='IN'?'received at stall':'returned to outlet'}. Transfer: ${result.transferId}`);
   setItems([]);setProduct('');setQuantity('1');await load();
  }catch(err){setError(err.response?.data?.error || err.response?.data?.detail || 'Unable to transfer stock. Your list is kept; retry using the same details.');}
  finally{setBusy(false);}
 };
 return <Card><CardHeader title="Stall Stock In / Return" action={<Button variant="secondary" disabled={busy} onClick={load}>Refresh</Button>}/><CardContent>
 <p>Linked outlet: <strong>{data?.stall?.linkedOutletName || data?.stall?.linkedOutletId || 'Loading…'}</strong>. Stock moves between this outlet and your stall; transfers do not count as sales.</p>
 {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,240px),1fr))',gap:'1rem'}}>
 <Select label="Movement" value={direction} onChange={e=>{setDirection(e.target.value);setProduct('');setQuantity('1');setItems([]);setError('');setMessage('');}} options={[{value:'IN',label:'Stock In — outlet to stall'},{value:'RETURN',label:'Return unsold stock — stall to outlet'}]} disabled={busy}/>
 <Select label="Product" value={product} onChange={e=>setProduct(e.target.value)} options={[{value:'',label:'Choose product'},...(source || []).filter(row=>available(row.productId)>0).map(row=>({value:row.productId,label:`${row.productName || row.productId} · Available: ${available(row.productId)}`}))]} disabled={busy || !data}/>
 <Input label="Quantity" type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)} disabled={busy}/>
 </div>
 <Button variant="secondary" disabled={busy || !product} onClick={add}>Add product to list</Button>
 <h3>Transfer list · {items.length} products · {items.reduce((total,item)=>total+(Number(item.quantity) || 0),0)} units</h3>
 <p>Add all products here, then submit once. Switching the movement clears this list.</p>
 <div style={{display:'grid',gap:'.75rem',marginBottom:'1rem'}}>{items.map(item=><div key={item.productId} style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap',padding:'1rem',border:'1px solid var(--color-border)',borderRadius:'.75rem'}}>
  <div style={{flex:'1 1 200px',minWidth:0,overflowWrap:'anywhere'}}><strong>{item.productName}</strong><div>Available: {available(item.productId)}</div></div>
  <div style={{flex:'0 1 160px'}}><Input label={`Quantity for ${item.productName}`} type="number" min="1" max={available(item.productId)} step="1" value={item.quantity} disabled={busy} onChange={event=>setItems(current=>current.map(row=>row.productId===item.productId?{...row,quantity:event.target.value}:row))}/></div>
  <Button variant="secondary" disabled={busy} aria-label={`Remove ${item.productName}`} onClick={()=>setItems(current=>current.filter(row=>row.productId!==item.productId))}>Remove</Button>
 </div>)}</div>
 {!items.length && <p>No products added yet.</p>}
 <Button disabled={busy || !items.length} onClick={submit}>{busy?'Saving…':direction==='IN'?'Receive stock at stall':'Return stock to linked outlet'}</Button>
 <h3>Recent stock transfers</h3><Table columns={[{key:'recordedAt',label:'Date'},{key:'direction',label:'Movement',render:r=>r.direction==='IN'?'Outlet → Stall':'Stall → Outlet'},{key:'items',label:'Products',render:r=>(r.items || []).map(item=><div key={item.productId}>{item.productName || item.productId} × {item.quantity}</div>)},{key:'recordedBy',label:'Recorded by'}]} data={data?.transfers || []} emptyStateMessage="No transfers recorded yet."/>
 </CardContent></Card>;
}
