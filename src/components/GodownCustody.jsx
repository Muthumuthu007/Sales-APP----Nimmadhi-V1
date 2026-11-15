import {Modal} from './ui/Modal';
import GodownDispatchReceive from './GodownDispatchReceive';
import React, {useEffect, useRef, useState, useCallback} from 'react';
import api from '../api/axios';
import GroupedProductPicker from './GroupedProductPicker';
import {productionOption} from '../utils/productHierarchy';
import {Card, CardHeader, CardContent} from './ui/Card';
import {Input, Select} from './ui/Input';
import {Button} from './ui/Button';
import {Table} from './ui/Table';

export default function GodownCustody({stockView = false,refreshKey=0,onSaved,showHoldings=true}) {
 const [holdings,setHoldings]=useState([]),[outlets,setOutlets]=useState([]),[products,setProducts]=useState([]);
 const [destination,setDestination]=useState(''),[product,setProduct]=useState(''),[quantity,setQuantity]=useState('1'),[direction,setDirection]=useState('IN');
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [entryMode,setEntryMode]=useState('MANUAL');
 const [holdingsReady,setHoldingsReady]=useState(false);
 const requestId=useRef(null);
 const [conversion,setConversion]=useState(null),[conversionError,setConversionError]=useState('');
 const conversionRequest=useRef(null);
 const [emergency,setEmergency]=useState(null),[emergencyTarget,setEmergencyTarget]=useState(''),[emergencyQuantity,setEmergencyQuantity]=useState(''),[emergencyReason,setEmergencyReason]=useState(''),[emergencyError,setEmergencyError]=useState('');
 const emergencyRequest=useRef(null);
 const load=useCallback(async()=>{setLoading(true);setError('');
  const [saved,catalogue]=await Promise.allSettled([api.get('/godown/custody'),stockView?Promise.resolve(null):api.get('/products')]);
  const failures=[];
  if(saved.status==='fulfilled'){setHoldings(saved.value.holdings||[]);setOutlets(saved.value.outlets||[]);setHoldingsReady(true);}
  else failures.push('Unable to refresh temporary stock. Use Refresh to retry.');
  if(catalogue.status==='fulfilled'){if(catalogue.value)setProducts((catalogue.value.products||[]).map(productionOption));}
  else failures.push('The product catalogue is unavailable. Saved temporary goods are still listed below; refresh before entering another product.');
  setError(failures.join(' '));setLoading(false);
 },[stockView]);
 useEffect(()=>{load();},[load,refreshKey]);
 const change=(setter,value)=>{requestId.current=null;setter(value);setNotice('');};
 const submit=async event=>{event.preventDefault();const count=Number(quantity);if(!destination||!product||!Number.isSafeInteger(count)||count<1){setError('Select the destination outlet, product and a positive whole quantity.');return;}setBusy(true);setError('');requestId.current ||= crypto.randomUUID();try{const saved=await api.post('/godown/custody',{destinationOutletId:destination,productId:product,quantity:count,direction,requestId:requestId.current});setHoldings(current=>[...current.filter(row=>row.productId!==saved.productId||row.destinationOutletId!==saved.destinationOutletId),...(Number(saved.quantity)>0?[saved]:[])]);setHoldingsReady(true);requestId.current=null;setNotice(direction==='IN'?'Temporary goods received. Godown own stock is unchanged.':'Temporary goods released. Godown own stock is unchanged.');setQuantity('1');onSaved?.();await load();}catch(err){setError(err.response?.data?.error||'Unable to save. Retry with the same details to safely check this movement.');}finally{setBusy(false);}};
 const convert=async()=>{
  if(!conversion)return;setBusy(true);setConversionError('');conversionRequest.current ||= crypto.randomUUID();
  try{const result=await api.post('/godown/custody/convert',{productId:conversion.productId,destinationOutletId:conversion.destinationOutletId,expectedQuantity:Number(conversion.quantity),expectedUpdatedAt:conversion.updatedAt,requestId:conversionRequest.current});setHoldings(rows=>rows.filter(row=>row.productId!==conversion.productId||row.destinationOutletId!==conversion.destinationOutletId));setConversion(null);conversionRequest.current=null;setNotice(`${result.movedQuantity} units moved to permanent godown stock. Temporary entry removed.`);onSaved?.();await load();}
  catch(err){setConversionError(err.response?.data?.error||'Unable to confirm the transfer. Retry with the same entry to safely check this movement.');}finally{setBusy(false);}
 };
 const transferEmergency=async()=>{
  if(!emergency)return;const count=Number(emergencyQuantity);
  if(!emergencyTarget || emergencyTarget===emergency.destinationOutletId || !Number.isSafeInteger(count) || count<1 || count>Number(emergency.quantity) || emergencyReason.trim().length<5){setEmergencyError('Choose another outlet, a valid quantity and an emergency reason.');return;}
  setBusy(true);setEmergencyError('');emergencyRequest.current ||= crypto.randomUUID();
  try{const result=await api.post('/godown/custody/emergency-transfer',{requestId:emergencyRequest.current,productId:emergency.productId,destinationOutletId:emergency.destinationOutletId,toOutletId:emergencyTarget,quantity:count,expectedQuantity:Number(emergency.quantity),expectedUpdatedAt:emergency.updatedAt,reason:emergencyReason.trim()},{timeout:120000});setEmergency(null);emergencyRequest.current=null;setNotice(`${result.reference}: ${result.quantity} units sent to ${result.toOutletId}. ${result.permanentQuantity || 0} units moved to permanent godown stock. Replacement ${result.replacementOrderNumber} for all ${result.replacementQuantity} units for ${result.fromOutletId} is ready in Create Load.`);onSaved?.();await load();}
  catch(err){setEmergencyError(err.response?.data?.error||'Unable to confirm this transfer. Retry using the same details to check it safely.');}finally{setBusy(false);}
 };
 const visible=direction==='OUT'?products.filter(p=>holdings.some(h=>h.destinationOutletId===destination&&h.productId===p.value&&Number(h.quantity)>0)):products;
 return <Card><CardHeader title={stockView?'Temporary goods held for outlets':'Temporary Stocks'} action={<Button variant="secondary" onClick={load} disabled={busy||loading}>Refresh</Button>}/><CardContent>
 <p>{stockView ? "The godown is temporarily holding these products for the outlets listed below. These quantities are excluded from the godown’s own stock. Receive or release goods in Temporary Stocks." : "Record goods temporarily held for an outlet, or release them when they leave. These quantities are excluded from the godown’s own stock."}</p>
 {loading&&<p role="status">Loading…</p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!stockView&&!loading&&<Select label="Temporary stock entry" value={entryMode} disabled={busy} onChange={e=>setEntryMode(e.target.value)} options={[{value:'MANUAL',label:'Manual receive / release'},{value:'DISPATCH',label:'Receive from factory dispatched orders'}]}/>}
 {!stockView&&!loading&&entryMode==='DISPATCH'&&<GodownDispatchReceive outlets={outlets} onReceived={()=>{setNotice('Factory dispatch goods received into temporary stocks. Godown own stock is unchanged.');onSaved?.();load();}}/>}
 {!stockView&&!loading&&entryMode==='MANUAL'&&<form onSubmit={submit} style={{display:'grid',gap:'1rem',maxWidth:760,marginBottom:'1.5rem'}}>
 <Select label="Movement" value={direction} disabled={busy} onChange={e=>{change(setDirection,e.target.value);setProduct('');}} options={[{value:'IN',label:'Receive temporary goods'},{value:'OUT',label:'Release temporary goods to outlet'}]}/>
 <Select label="Destination outlet — goods belong to" value={destination} disabled={busy} onChange={e=>{change(setDestination,e.target.value);setProduct('');}} options={[{value:'',label:'Select destination outlet…'},...outlets.map(o=>({value:o.outletId,label:`${o.outletName} (${o.outletId})`}))]}/>
 <GroupedProductPicker options={visible} value={product} onChange={v=>change(setProduct,v)} disabled={busy}/>
 <Input label="Quantity" type="number" min="1" step="1" value={quantity} disabled={busy} onChange={e=>change(setQuantity,e.target.value)}/>
 <Button disabled={busy||!destination||!product} type="submit">{busy?'Saving…':direction==='IN'?'Confirm temporary receipt':'Confirm release'}</Button>
 </form>}
 {showHoldings&&holdingsReady&&<Table columns={[{key:'destinationOutletName',label:'Destination outlet',render:r=>`${r.destinationOutletName} (${r.destinationOutletId})`},{key:'productName',label:'Product'},{key:'quantity',label:'Quantity held'},{key:'updatedAt',label:'Updated',render:r=>new Date(r.updatedAt).toLocaleString()},{key:'actions',label:'Action',render:row=><div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}><Button writeAction variant="secondary" disabled={busy||loading} onClick={()=>{setConversion(row);setConversionError('');conversionRequest.current=null;}}>Delete temporary bill</Button><Button writeAction variant="secondary" disabled={busy||loading} onClick={()=>{setEmergency(row);setEmergencyTarget('');setEmergencyQuantity(String(row.quantity));setEmergencyReason('');setEmergencyError('');emergencyRequest.current=null;}}>Emergency transfer</Button></div>}]} data={holdings} emptyStateMessage="No temporary goods are held for outlets."/>}
 <Modal isOpen={Boolean(emergency)} title="Emergency transfer and factory replacement" onClose={()=>!busy&&setEmergency(null)}>
 {emergency&&<div style={{display:'grid',gap:'1rem'}}><p><strong>{emergency.productName}</strong> · {emergency.quantity} units held for {emergency.destinationOutletName || emergency.destinationOutletId} ({emergency.destinationOutletId})</p>
 <Select label="Send urgently to outlet" disabled={busy} value={emergencyTarget} onChange={e=>{emergencyRequest.current=null;setEmergencyTarget(e.target.value);}} options={[{value:'',label:'Select another outlet…'},...outlets.filter(o=>o.outletId!==emergency.destinationOutletId).map(o=>({value:o.outletId,label:`${o.outletName} (${o.outletId})`}))]}/>
 <Input label="Quantity to transfer" type="number" min="1" max={Number(emergency.quantity)} step="1" disabled={busy} value={emergencyQuantity} onChange={e=>{emergencyRequest.current=null;setEmergencyQuantity(e.target.value);}}/>
 <label>Emergency reason<textarea style={{display:'block',width:'100%',minHeight:90}} disabled={busy} maxLength={1000} value={emergencyReason} onChange={e=>{emergencyRequest.current=null;setEmergencyReason(e.target.value);}}/></label>
 <div role="status"><p><strong>{Number(emergencyQuantity)||0} units</strong> will be dispatched to the selected outlet, awaiting receipt.</p><p>The remaining <strong>{Math.max(0,Number(emergency.quantity)-(Number(emergencyQuantity)||0))} units</strong> will move to permanent godown stock. This temporary entry will be cleared.</p><p>A replacement for <strong>all {emergency.quantity} units</strong>, with the same product and size, will be created for <strong>{emergency.destinationOutletId}</strong>, automatically approved and assigned to Factory in <strong>Create Load</strong>. No sales bill or payment is created.</p></div>
 {emergencyError&&<p role="alert">{emergencyError}</p>}<div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}><Button variant="secondary" disabled={busy} onClick={()=>setEmergency(null)}>Cancel</Button><Button writeAction disabled={busy||!emergencyTarget||emergencyReason.trim().length<5||!Number.isSafeInteger(Number(emergencyQuantity))||Number(emergencyQuantity)<1||Number(emergencyQuantity)>Number(emergency.quantity)} onClick={transferEmergency}>{busy?'Saving transfer and replacement…':'Confirm transfer and create replacement'}</Button></div></div>}
 </Modal>
 <Modal isOpen={Boolean(conversion)} title="Move temporary goods to permanent stock" onClose={()=>!busy&&setConversion(null)}>
 {conversion&&<><p><strong>{conversion.productName}</strong></p><p>Outlet: {conversion.destinationOutletName || conversion.destinationOutletId} ({conversion.destinationOutletId})</p><p>Move all <strong>{conversion.quantity} units</strong> from this temporary holding into this godown’s permanent stock?</p><p>The temporary entry will be removed. Its movement history and any sales bills remain saved.</p>{conversionError&&<p role="alert">{conversionError}</p>}<div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}><Button variant="secondary" disabled={busy} onClick={()=>setConversion(null)}>Cancel</Button><Button writeAction disabled={busy} onClick={convert}>{busy?'Moving…':'Confirm move to permanent stock'}</Button></div></>}
 </Modal>
 </CardContent></Card>;
}
