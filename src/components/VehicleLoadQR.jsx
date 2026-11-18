import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Html5Qrcode} from 'html5-qrcode';
import api from '../api/axios';
import {Button} from './ui/Button';
import {Input} from './ui/Input';
import './VehicleLoadQR.css';

export default function VehicleLoadQR({load,onDone,onBusyChange}){
 const [state,setState]=useState(null),[value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[camera,setCamera]=useState(false);
 const inFlight=useRef(false),scanner=useRef(null),field=useRef(null),lastRead=useRef({});
 useEffect(()=>{onBusyChange?.(busy);},[busy,onBusyChange]);
 useEffect(()=>()=>onBusyChange?.(false),[onBusyChange]);
 useEffect(()=>{if(!busy)field.current?.querySelector('input')?.focus();},[busy]);
 useEffect(()=>{if(state?.complete)setCamera(false);},[state?.complete]);
 const path='/vehicle-loads/'+encodeURIComponent(load.loadId);
 const refresh=useCallback(async()=>{const result=await api.get(path+'/scans');setState(result);return result;},[path]);
 useEffect(()=>{let active=true;api.get(path+'/scans').then(result=>{if(active)setState(result);}).catch(err=>{if(active)setError(err.response?.data?.error || 'Unable to load saved scans. Retry.');});return()=>{active=false;};},[path]);
 const accept=useCallback(async(raw,remove=false)=>{
  if(inFlight.current)return;
  const unit=String(raw || '').trim();if(!unit)return;
  inFlight.current=true;setBusy(true);setError('');setMessage('');
  try{const result=await api.post(path+'/scans',{unit_id:unit,...(remove?{action:'remove'}:{})});setState(result);setMessage(result.message || 'Scan saved.');setValue('');}
  catch(err){setError(err.response?.data?.error || 'Scan could not be confirmed. Retry the same QR safely.');}
  finally{inFlight.current=false;setBusy(false);}
 },[path]);
 useEffect(()=>{
  if(!camera)return;
  let cancelled=false;const active=new Html5Qrcode('vehicle-load-camera');scanner.current=active;
  const stop=async()=>{try{if(active.isScanning)await active.stop();active.clear();}catch{/* Camera already stopped. */}};
  active.start({facingMode:'environment'},{fps:10,qrbox:{width:220,height:220}},raw=>{
   if(cancelled || inFlight.current || (lastRead.current.raw===raw && Date.now()-lastRead.current.at<2500))return;
   lastRead.current={raw,at:Date.now()};accept(raw);
  },()=>{}).then(()=>{if(cancelled)stop();}).catch(err=>{if(!cancelled){setError(err.message || 'Camera unavailable. Use a USB scanner or paste the QR unit ID.');setCamera(false);}});
  return()=>{cancelled=true;scanner.current=null;stop();};
 },[camera,accept]);
 const finish=async()=>{
  if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');setCamera(false);
  try{await api.post(path+'/dispatch',{scanMethod:'QR'},{timeout:120000});onDone?.();}
  catch(err){setError(err.response?.data?.error || 'Unable to confirm dispatch. Refresh saved progress before retrying.');await refresh().catch(()=>{});}
  finally{inFlight.current=false;setBusy(false);}
 };
 const ready=state?.status==='READY',finished=state?.status==='DISPATCHED'&&!state?.qrSyncPending;
 return <div className="vehicle-load-qr">
  <p>Scan one unique QR for every unit in this load, including factory-assigned complimentary items. Scans are saved; the load is dispatched only when you confirm below.</p>
  {error&&<div role="alert" className="vehicle-qr-error">{error}</div>}
  {message&&<p role="status">{message}</p>}
  {!state?<Button variant="secondary" onClick={()=>refresh().catch(()=>setError('Unable to load saved scans. Retry.'))}>Reload saved scans</Button>:<>
   <div className="vehicle-qr-progress" role="status"><strong>{state.scanned} / {state.required} scanned</strong><span>{state.complete?'All required units scanned':`${Math.max(0,state.required-state.scanned)} remaining`}</span></div>
   {ready&&<form onSubmit={event=>{event.preventDefault();accept(value);}} className="vehicle-qr-entry">
    <div ref={field}><Input label="Scan or paste QR unit ID" autoFocus value={value} disabled={busy} onChange={event=>setValue(event.target.value)} placeholder="USB scanner: scan, then Enter"/></div>
    <Button writeAction type="submit" disabled={busy||!value.trim()}>{busy?'Checking…':'Add scan'}</Button>
    <Button writeAction type="button" variant="secondary" disabled={busy} onClick={()=>setCamera(!camera)}>{camera?'Stop camera':'Use camera'}</Button>
   </form>}
   {camera&&<div id="vehicle-load-camera"/>}
   <div className="vehicle-qr-lines">{state.lines.map(line=><div key={line.lineKey}><div><strong>{line.productName || line.productId}</strong><small>Order {line.orderNumber || line.orderId} · {line.outletId}</small></div><span className={line.scanned===line.quantity?'vehicle-qr-complete':''}>{line.scanned} / {line.quantity}</span></div>)}</div>
   {!!state.units.length&&<details><summary>Scanned units ({state.units.length})</summary><ul className="vehicle-qr-units">{state.units.map(unit=><li key={unit.unitId}><span>{unit.unitId}</span>{ready&&<Button writeAction variant="secondary" disabled={busy} onClick={()=>accept(unit.unitId,true)}>Remove</Button>}</li>)}</ul></details>}
   <div className="vehicle-qr-footer"><Button variant="secondary" disabled={busy} onClick={()=>refresh().catch(()=>setError('Unable to refresh saved scans.'))}>Refresh progress</Button>{finished?<Button onClick={onDone}>Done</Button>:<Button writeAction disabled={busy||(!state.complete&&!state.qrSyncPending)} onClick={finish}>{busy?'Confirming…':state.qrSyncPending?'Finish QR synchronization':'Confirm QR dispatch of entire load'}</Button>}</div>
  </>}
 </div>;
}
