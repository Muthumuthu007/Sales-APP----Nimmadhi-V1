import VehicleLoadQR from './VehicleLoadQR';
import {OrderContentsColumns} from './OrderContentsColumn';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import api from '../api/axios';
import {Button} from './ui/Button';
import {Input} from './ui/Input';
import {Card,CardHeader,CardContent} from './ui/Card';
import {Modal} from './ui/Modal';
import './VehicleLoads.css';

export default function VehicleLoads({creating=false,history=false,onChanged}){
 const [data,setData]=useState({plans:[],loads:[]}),[selected,setSelected]=useState([]),[vehicle,setVehicle]=useState(''),[driver,setDriver]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[confirmation,setConfirmation]=useState(null);
 const [qrLoad,setQrLoad]=useState(null),[qrBusy,setQrBusy]=useState(false);
 const requestId=useRef(null);
 const load=useCallback(async()=>{setLoading(true);try{const result=await api.get('/vehicle-loads',{timeout:120000});setData(result);setSelected(current=>current.filter(id=>(result.plans || []).some(plan=>identity(plan)===id)));setError('');}catch(err){setError(err.response?.data?.error || err.message || 'Unable to load vehicle loads.');}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 const identity=plan=>`${plan.orderId}|${plan.loadPlanId}`;
 const chosen=data.plans.filter(plan=>selected.includes(identity(plan)));
 const total=chosen.reduce((sum,plan)=>sum+Number(plan.quantity),0);
 const toggle=plan=>{requestId.current=null;const id=identity(plan);setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);};
 const create=async()=>{
  if(!chosen.length)return;setBusy(true);setError('');setMessage('');requestId.current ||= crypto.randomUUID();
  try{const result=await api.post('/vehicle-loads',{requestId:requestId.current,plans:chosen.map(({orderId,loadPlanId})=>({orderId,loadPlanId})),vehicleNumber:vehicle,driverName:driver},{timeout:120000});setMessage(`${result.load.loadNumber} created · ${result.load.quantity} pieces. Open Dispatch Plans to dispatch this load.`);setSelected([]);setVehicle('');setDriver('');requestId.current=null;await load();}catch(err){setError(err.response?.data?.error || 'Unable to confirm the save. Retry with the same selection or refresh to check saved loads.');}finally{setBusy(false);}
 };
 const act=async()=>{if(!confirmation)return;setBusy(true);setError('');try{const {load:row,action}=confirmation;const result=await api.post(`/vehicle-loads/${row.loadId}/${action}`,{},{timeout:120000});setMessage(result.message);setConfirmation(null);await load();onChanged?.();}catch(err){setError(err.response?.data?.error || 'Unable to confirm this action. Refresh and retry.');}finally{setBusy(false);}};
 const details=row=><div className="vehicle-load-plans">{row.plans.map(plan=><details key={identity(plan)} open><summary>Order {plan.orderNumber || plan.orderId} · Plan {plan.planNumber || plan.loadPlanId} · {plan.outletId}</summary><OrderContentsColumns items={plan.items}/></details>)}</div>;
 const loads=data.loads.filter(row=>history?row.status==='DISPATCHED':row.status==='READY'||row.qrSyncPending);
 return <section className="vehicle-loads">
 <Card><CardHeader title={creating?'Create Load':history?'Dispatched vehicle loads':'Vehicle loads awaiting dispatch'} action={<Button variant="secondary" onClick={load} disabled={loading||busy}>Refresh</Button>}/><CardContent>
 <p>{creating?'Select whole factory-assigned plans travelling in the same vehicle. The admin decides vehicle capacity. Godown assignments stay separate.':history?'Each load retains its orders, products and dispatch history.':'Review the included orders, then dispatch the entire vehicle load in one action.'}</p>
 {error&&<p role="alert" className="vehicle-load-error">{error}</p>}{message&&<p role="status">{message}</p>}
 {loading?<p role="status">Loading vehicle loads…</p>:<>
 {creating&&<><div className="vehicle-load-form"><Input label="Vehicle number (optional)" value={vehicle} maxLength={80} disabled={busy} onChange={e=>{requestId.current=null;setVehicle(e.target.value);}}/><Input label="Driver name (optional)" value={driver} maxLength={150} disabled={busy} onChange={e=>{requestId.current=null;setDriver(e.target.value);}}/></div>
 <div className="vehicle-load-selection">{data.plans.map(plan=><article key={identity(plan)}><label><input type="checkbox" checked={selected.includes(identity(plan))} disabled={busy} onChange={()=>toggle(plan)}/><span><strong>{plan.planNumber}</strong> · Order {plan.orderNumber}<small>{plan.outletId} · {plan.quantity} pieces</small></span></label><details><summary>Products in this plan</summary><OrderContentsColumns items={plan.items}/></details></article>)}</div>
 {!data.plans.length&&<p>No unassigned factory plans are waiting for a vehicle load.</p>}
 <div className="vehicle-load-total"><strong>{chosen.length} plans selected · {total} pieces</strong><Button writeAction disabled={busy||!chosen.length} onClick={create}>{busy?'Saving…':'Create load'}</Button></div>
 <h3>Loads ready for dispatch</h3></>}
 {!loads.length&&<p>No {history?'dispatched':'ready'} vehicle loads.</p>}
 <div className="vehicle-load-cards">{loads.map(row=><article className="vehicle-load-card" key={row.loadId}><header><div><h3>{row.loadNumber}</h3><span>{row.plans.length} plans · {row.quantity} pieces · {row.status}</span><p>{row.vehicleNumber || 'Vehicle not recorded'}{row.driverName&&` · ${row.driverName}`}</p>{row.dispatchedAt&&<small>Dispatched {new Date(row.dispatchedAt).toLocaleString('en-IN')} by {row.dispatchedBy}</small>}</div><div className="vehicle-load-dispatch-options">{!creating&&!history&&<><Button writeAction variant="secondary" onClick={()=>setConfirmation({load:row,action:row.status==='CANCELLED'?'cancel':'dispatch'})} disabled={busy}>{row.qrSyncPending?'Finish QR synchronization':'Dispatch manually'}</Button>{row.status==='READY'&&<Button writeAction onClick={()=>setQrLoad(row)} disabled={busy}>Scan QR · {row.qrScannedCount || 0}/{row.quantity}</Button>}</>}{creating&&<Button writeAction variant="secondary" onClick={()=>setConfirmation({load:row,action:'cancel'})} disabled={busy}>Cancel load</Button>}</div></header>{details(row)}</article>)}</div>
 </>}
 </CardContent></Card>
 <Modal className="vehicle-qr-dialog" isOpen={Boolean(qrLoad)} onClose={()=>{if(!qrBusy){setQrLoad(null);load();}}} title={qrLoad?`Scan QR — ${qrLoad.loadNumber}`:''}>{qrLoad&&<VehicleLoadQR load={qrLoad} onBusyChange={setQrBusy} onDone={()=>{setQrLoad(null);load();onChanged?.();}}/>}</Modal>
 <Modal isOpen={Boolean(confirmation)} onClose={()=>!busy&&setConfirmation(null)} title={confirmation?`${confirmation.action==='dispatch'?'Dispatch':'Cancel'} ${confirmation.load.loadNumber}`:''}>
 {confirmation&&<><p>{confirmation.action==='dispatch'?`Dispatch all ${confirmation.load.quantity} pieces across ${confirmation.load.plans.length} plans? Every included factory assignment will be marked dispatched together.`:'Cancel this load and release its plans so the admin can create a different load?'} </p>{details(confirmation.load)}{error&&<p role="alert">{error}</p>}<div className="vehicle-load-total"><Button variant="secondary" disabled={busy} onClick={()=>setConfirmation(null)}>Back</Button><Button writeAction disabled={busy} onClick={act}>{busy?'Saving…':confirmation.action==='dispatch'?'Confirm entire load dispatch':'Confirm cancellation'}</Button></div></>}
 </Modal>
 </section>;
}
