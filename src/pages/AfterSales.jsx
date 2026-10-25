import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import api from '../api/axios';
import {AuthContext} from '../context/AuthContext';
import {Card, CardHeader, CardContent} from '../components/ui/Card';
import {Button} from '../components/ui/Button';
import {Input, Select} from '../components/ui/Input';
import {Modal} from '../components/ui/Modal';
import ProductMrp from '../components/ProductMrp';
import './AfterSales.css';

const label=value=>String(value || '').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const message=err=>{const data=err.response?.data;return typeof data==='string'?data:Array.isArray(data)?data.join(' '):data?.error || data?.detail || 'Unable to save. Refresh and try again.';};
const empty={caseType:'REFURBISHMENT',saleId:'',unitNumber:'1',godownId:'',reason:'',inspectionNotes:'',customerName:'',customerPhone:'',customerAddress:''};
export default function AfterSales({godownMode=false, factoryMode=false}) {
 const {role,outletId}=useContext(AuthContext);const admin=['MANAGER','FACTORY_MANAGER'].includes(role);
 const [originalOutlets,setOriginalOutlets]=useState([]),[invoice,setInvoice]=useState(''),[lookingUp,setLookingUp]=useState(false);
 const [records,setRecords]=useState([]),[godowns,setGodowns]=useState([]),[sales,setSales]=useState([]),[products,setProducts]=useState([]);
 const [error,setError]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[search,setSearch]=useState('');
 const [creating,setCreating]=useState(false),[form,setForm]=useState(empty),[selectedId,setSelectedId]=useState(''),[action,setAction]=useState(''),[details,setDetails]=useState({});
 const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
 const load=useCallback(async()=>{setLoading(true);setError('');try {const data=await api.get('/after-sales');setRecords(data.cases || []);setGodowns(data.godowns || []);setOriginalOutlets(data.outlets || []);}catch(err){setError(message(err));}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{if(admin || godownMode)api.get('/products').then(data=>setProducts(data.products || [])).catch(err=>setError(message(err)));else if(!godownMode)api.get('/after-sales/sales').then(data=>setSales(data.sales || [])).catch(err=>setError(message(err)));},[admin,godownMode]);
 const lookupSale=async()=>{setLookingUp(true);setError('');setSales([]);setForm(f=>({...f,saleId:''}));try {const data=await api.get('/after-sales/sales',{params:{outletId:form.outletId,invoice:invoice.trim()}});setSales(data.sales || []);if(!data.sales?.length)setError('No sale found. Check the original outlet and exact invoice number or sale reference.');}catch(err){setError(message(err));}finally{setLookingUp(false);}};
 const selected=records.find(r=>r.caseId===selectedId);
 const sale=sales.find(r=>r.saleId===form.saleId);
 const filtered=useMemo(()=>records.filter(r=>(!factoryMode || ['TO_FACTORY','AT_FACTORY','WORK_COMPLETE','FACTORY_ORDERED','NEW_TO_GODOWN','TO_OUTLET'].includes(r.status)) && [r.caseId,r.customerName,r.customerPhone,r.productName,r.replacementProductName,r.billNo,r.label,r.status].join(' ').toLowerCase().includes(search.toLowerCase())),[records,search,factoryMode]);
 const change=(field,value)=>{setForm(f=>({...f,[field]:value}));setRequestId(crypto.randomUUID());};
 const changeDetails=(field,value)=>{setDetails(f=>({...f,[field]:value}));setRequestId(crypto.randomUUID());};
 const submit=async()=>{setSaving(true);setError('');try {
   if(creating){await api.post('/after-sales',{...form,unitNumber:Number(form.unitNumber),requestId});setCreating(false);setForm(empty);}
   else {await api.post(`/after-sales/${selectedId}/action`,{...details,action,requestId});setAction('');}
   setRequestId(crypto.randomUUID());await load();
 }catch(err){setError(message(err));}finally{setSaving(false);}};
 const openAction=value=>{setAction(value);setDetails({notes:'',refurbishmentMode:'',eligibilityBasis:'',deliveryDate:'',replacementProductId:'',priceHandling:''});setRequestId(crypto.randomUUID());setError('');};
 return <div className="after-sales">
  <Card><CardHeader title={factoryMode?'After-sales factory work':'After-sales · Refurbishment & Replacement'} action={<Button variant="secondary" onClick={load} disabled={loading || saving}>Refresh</Button>}/><CardContent>
   <p>Refurbishment: Customer → Outlet → Godown → Factory → Outlet → Customer.</p>
   <p>Replacement: Godown orders → Factory → Godown → Customer. Returned beds go to Inventory Credit Note.</p>
   <p>Service beds are tracked separately from available stock. Each case represents one sold bed.</p>
   <Input label="Search cases by customer, product, invoice or status" value={search} onChange={e=>setSearch(e.target.value)}/>
   {!admin && <Button onClick={()=>{setForm({...empty,caseType:godownMode?'REPLACEMENT':'REFURBISHMENT',godownId:godownMode?outletId:'',outletId:''});setCreating(true);setError('');setRequestId(crypto.randomUUID());}}>{godownMode?'Inspect bed / Create replacement order':'Submit refurbishment inspection'}</Button>}
  </CardContent></Card>
  {error && <p role="alert" className="after-sales-error">{error}</p>}
  {loading?<p>Loading after-sales cases…</p>:filtered.length===0?<p>No after-sales cases found.</p>:<div className="after-sales-list">{filtered.map(r=><Card key={r.caseId}><CardContent>
    <span className="after-sales-tag">{r.label} bed</span><h3>{r.productName}</h3><ProductMrp item={{productId:r.productId}}/>
    {r.replacementProductName && <p><strong>{r.replacementProductName}</strong> replaces <strong>{r.productName}</strong> · Quantity: 1{r.replacementOrderId && <><br/>Order: {r.replacementOrderId}</>}</p>}
    <p>{r.customerName} · {r.customerPhone}</p><p>{label(r.status)} · {r.outletId} → {r.godownId}</p>
    {r.caseType==='REPLACEMENT' && <p>Original bed: {label(r.returnStatus)}</p>}
    <Button variant="secondary" onClick={()=>{setSelectedId(r.caseId);setAction('');setError('');}}>View case / Record movement</Button>
  </CardContent></Card>)}</div>}
  <Modal isOpen={creating || Boolean(selected)} onClose={()=>{if(!saving){setCreating(false);setSelectedId('');setAction('');}}} title={creating?'Submit after-sales inspection':`${selected?.label || ''} · Case details`}>
   {error && <p role="alert" className="after-sales-error">{error}</p>}
   {creating?<div className="after-sales-form">
    <Select label="Service type" options={(godownMode?['REPLACEMENT']:['REFURBISHMENT']).map(value=>({value,label:label(value)}))} value={form.caseType} onChange={e=>change('caseType',e.target.value)}/>
    {godownMode && <>
     <Select label="Original selling outlet (invoice lookup only)" value={form.outletId || ''} onChange={e=>{change('outletId',e.target.value);change('saleId','');setSales([]);}} options={[{value:'',label:'Choose original outlet'},...originalOutlets]}/>
     <Input label="Original invoice number or sale reference" value={invoice} onChange={e=>{setInvoice(e.target.value);setSales([]);change('saleId','');}}/>
     <Button variant="secondary" disabled={lookingUp || !form.outletId || !invoice.trim()} onClick={lookupSale}>{lookingUp?'Finding sale…':'Find original sale'}</Button>
    </>}
    <Select label="Original sold product / customer / invoice" value={form.saleId} onChange={e=>{change('saleId',e.target.value);change('unitNumber','1');}} options={[{value:'',label:'Choose the original sale'},...sales.map(r=>({value:r.saleId,label:`${r.customerName || 'Customer details needed'} · ${r.productName} · ${r.billNo || r.saleReferenceId} · ${r.saleDate}`}))]}/>
    {sale && <p>{sale.customerName} · {sale.customerPhone}<br/>{sale.customerAddress}<br/>{sale.productName} · Sold quantity: {sale.quantity}</p>}
    {sale && ['customerName','customerPhone','customerAddress'].filter(field=>!sale[field]).map(field=><Input key={field} label={label(field.replace(/([A-Z])/g,' $1'))} value={form[field]} onChange={e=>change(field,e.target.value)}/>)}
    <Input label="Sold unit number (one case per bed)" type="number" min="1" max={sale?.quantity || 1} step="1" value={form.unitNumber} onChange={e=>change('unitNumber',e.target.value)}/>
    {!godownMode && <Select label="Assigned godown" options={[{value:'',label:'Choose godown'},...godowns]} value={form.godownId} onChange={e=>change('godownId',e.target.value)}/>}
    {godownMode && <><p>Ordering godown: {outletId}</p><Select label="New product B replacing the original product A" value={form.replacementProductId || ''} onChange={e=>change('replacementProductId',e.target.value)} options={[{value:'',label:'Choose the requested replacement bed'},...products.map(p=>({value:p.product_id || p.productId,label:p.product_name || p.productName}))]}/>{sale && form.replacementProductId && <p><strong>{products.find(p=>(p.product_id || p.productId)===form.replacementProductId)?.product_name}</strong> replaces <strong>{sale.productName}</strong> · Quantity: 1</p>}</>}
    <Input label="Customer request / reason" value={form.reason} onChange={e=>change('reason',e.target.value)}/>
    <Input label="Inspection findings and inspecting officer" value={form.inspectionNotes} onChange={e=>change('inspectionNotes',e.target.value)}/>
    <Button disabled={saving || !sale || !form.godownId || !form.reason.trim() || !form.inspectionNotes.trim() || (godownMode && !form.replacementProductId)} onClick={submit}>{saving?'Saving…':godownMode?'Submit replacement order for review':'Submit to godown / Admin review'}</Button>
   </div>:selected && <div className="after-sales-form">
    <strong>{selected.label} bed · {selected.productName}</strong><ProductMrp item={{productId:selected.productId}}/>
    <p>Case: {selected.caseId}<br/>Original sale: {selected.billNo || selected.saleReferenceId} · {selected.saleDate}<br/>Sold unit: {selected.unitNumber}</p>
    <p>{selected.customerName} · {selected.customerPhone}<br/>{selected.customerAddress}</p>
    <p>Outlet: {selected.outletId} · Godown: {selected.godownId}<br/>Status: {label(selected.status)}<br/>Reason: {selected.reason}<br/>Inspection: {selected.inspectionNotes}</p>
    {selected.refurbishmentMode && <p>Factory work: {label(selected.refurbishmentMode)}</p>}
    {selected.replacementProductName && <p><strong>{selected.replacementProductName}</strong> replaces <strong>{selected.productName}</strong> · Quantity: 1{selected.replacementOrderId && <><br/>Replacement order: {selected.replacementOrderId}</>}<ProductMrp item={{productId:selected.replacementProductId}}/><br/>Eligible until: {selected.eligibilityDeadline}<br/>Price adjustment: {label(selected.priceHandling)}<br/>Returned bed: {label(selected.returnStatus)}</p>}
    <div className="after-sales-actions">{(selected.availableActions || []).map(value=><Button key={value} variant={action===value?'primary':'secondary'} disabled={saving} onClick={()=>openAction(value)}>{label(value)}</Button>)}</div>
    {action && <div className="after-sales-form"><h4>{label(action)}</h4>
      {action==='APPROVE' && (selected.caseType==='REFURBISHMENT'?<Select label="Factory work required" value={details.refurbishmentMode} onChange={e=>changeDetails('refurbishmentMode',e.target.value)} options={[{value:'',label:'Confirm work type'},{value:'REPAIR_SAME_BED',label:'Repair and return the same bed'},{value:'SUPPLY_NEW_BED',label:'Supply a new bed; keep original at factory'}]}/>:<>
       {!selected.replacementProductId && <Select label="Replacement product" value={details.replacementProductId} onChange={e=>changeDetails('replacementProductId',e.target.value)} options={[{value:'',label:'Choose the requested new bed'},...products.map(p=>({value:p.product_id || p.productId,label:p.product_name || p.productName}))]}/>}
       <Select label="Six-month eligibility starts from" value={details.eligibilityBasis} onChange={e=>changeDetails('eligibilityBasis',e.target.value)} options={[{value:'',label:'Confirm policy basis'},{value:'INVOICE',label:'Original invoice date'},{value:'DELIVERY',label:'Original customer delivery date'}]}/>
       {details.eligibilityBasis==='DELIVERY' && <Input label="Verified original customer delivery date" type="date" value={details.deliveryDate} onChange={e=>changeDetails('deliveryDate',e.target.value)}/>}
       <Select label="Replacement price difference" value={details.priceHandling} onChange={e=>changeDetails('priceHandling',e.target.value)} options={[{value:'',label:'Confirm handling'},{value:'NO_ADJUSTMENT',label:'No payment or refund required'},{value:'HANDLED_SEPARATELY',label:'Handled separately; record reference in notes'}]}/>
      </>)}
      <Input label="Notes / handover or delivery acknowledgement" value={details.notes || ''} onChange={e=>changeDetails('notes',e.target.value)}/>
      <Button onClick={submit} disabled={saving || !details.notes?.trim()}>{saving?'Saving…':`Confirm ${label(action)}`}</Button>
    </div>}
    <h4>Case history</h4><ol className="after-sales-history">{selected.history.map((event,i)=><li key={i}><strong>{label(event.action)}</strong><br/>{new Date(event.at).toLocaleString()} · {event.by}<br/>{event.notes}</li>)}</ol>
   </div>}
  </Modal>
 </div>;
}
