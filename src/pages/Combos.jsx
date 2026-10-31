import React,{useEffect,useState} from 'react';
import api from '../api/axios';
import {idempotentPost} from '../api/idempotent';
import {fetchOutlets} from '../api/employees';
import {productionOption} from '../utils/productHierarchy';
import GroupedProductPicker from '../components/GroupedProductPicker';
import {Card,CardHeader,CardContent} from '../components/ui/Card';
import {Button} from '../components/ui/Button';
import {Input,Select} from '../components/ui/Input';
import {saleErrorDetails} from '../utils/salesDraft';
import './Combos.css';
const money=n=>Number(n || 0).toLocaleString('en-IN',{style:'currency',currency:'INR'});
const fresh=()=>({comboName:'',comboMrp:'',items:[],active:true});
const total=items=>items.reduce((sum,item)=>sum+Math.round(Number(item.mrp)*100)*Number(item.quantity),0)/100;
export default function Combos(){
 const [outlets,setOutlets]=useState([]),[location,setLocation]=useState(''),[outletId,setOutlet]=useState('');
 const [catalogue,setCatalogue]=useState({products:[],combos:[]}),[form,setForm]=useState(fresh),[line,setLine]=useState({productId:'',quantity:'1',mrp:''});
 const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[reload,setReload]=useState(0),[search,setSearch]=useState('');
 useEffect(()=>{let current=true;fetchOutlets().then(data=>{if(current)setOutlets((data.outlets || []).filter(row=>row.locationType!=='GODOWN'));}).catch(()=>{if(current)setError('Unable to load outlets. Refresh the page to retry.');});return()=>{current=false;};},[]);
 useEffect(()=>{let current=true;setCatalogue({products:[],combos:[]});setForm(fresh());setLine({productId:'',quantity:'1',mrp:''});setError('');if(!outletId)return;
 setLoading(true);api.get('/manager/combos',{params:{outletId}}).then(data=>{if(current)setCatalogue(data);}).catch(err=>{if(current)setError(saleErrorDetails(err.response?.data).join(' ') || 'Unable to load combos.');}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[outletId,reload]);
 const locations=[...new Map(outlets.map(row=>[String(row.locationName || '').trim().toLowerCase() || '__unassigned__',String(row.locationName || '').trim() || 'Unassigned outlets'])).entries()];
 const availableOutlets=outlets.filter(row=>!location || (String(row.locationName || '').trim().toLowerCase() || '__unassigned__')===location);
 const update=(key,value)=>setForm(current=>({...current,[key]:value}));
 const add=()=>{
  if(!line.productId || !Number.isSafeInteger(Number(line.quantity)) || Number(line.quantity)<1 || !Number.isFinite(Number(line.mrp)) || Number(line.mrp)<=0){setError('Choose a product, a whole quantity and its MRP per unit.');return;}
  if(form.items.some(item=>item.productId===line.productId)){setError('This product is already in the combo. Change its quantity below.');return;}
  const product=catalogue.products.find(item=>item.productId===line.productId);update('items',[...form.items,{productId:line.productId,productName:product?.productName,quantity:Number(line.quantity),mrp:line.mrp}]);setLine({productId:'',quantity:'1',mrp:''});setError('');
 };
 const save=async event=>{
  event.preventDefault();setError('');setNotice('');
  if(!outletId || !form.comboName.trim() || !form.items.length){setError('Choose an outlet, name the combo and add at least one product.');return;}
  if(form.items.some(item=>!Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity)<1 || Number(item.mrp)<=0 || !Number.isFinite(Number(item.mrp)))){setError('Each product needs a positive whole quantity and a valid MRP.');return;}
  if(!Number.isFinite(total(form.items)) || total(form.items)>9999999999.99){setError('The combo total is too large.');return;}
  const payload={outletId,comboName:form.comboName.trim(),comboMrp:String(form.comboMrp || total(form.items)),items:form.items.map(({productId,quantity,mrp})=>({productId,quantity:Number(quantity),mrp:String(mrp)})),active:form.active,expectedVersion:Number(form.version || 0)};
  setSaving(true);
  try{if(form.comboId)await api.put(`/manager/combos/${form.comboId}`,payload);else await idempotentPost(api,'/manager/combos',payload);setNotice('Combo saved for the selected outlet.');setReload(value=>value+1);}catch(err){setError(saleErrorDetails(err.response?.data).join(' ') || 'Unable to save the combo. Your details are retained; retry.');}finally{setSaving(false);}
 };
 const changeItem=(index,key,value)=>update('items',form.items.map((item,i)=>i===index?{...item,[key]:value}:item));
 return <div className="combos-page"><Card><CardHeader title="Combo dashboard"/><CardContent><p>Create Deepavali, Pongal and other product combos for each outlet.</p><div className="combo-grid"><Select label="Location" disabled={saving} value={location} onChange={event=>{setLocation(event.target.value);setOutlet('');setNotice('');}} options={[{value:'',label:'All locations'},...locations.map(([value,label])=>({value,label}))]}/><Select label="Outlet" disabled={saving} value={outletId} onChange={event=>{setOutlet(event.target.value);setNotice('');}} options={[{value:'',label:'Select an outlet'},...availableOutlets.map(row=>({value:row.outletId,label:`${row.outletName || row.outletId} (${row.outletId})`}))]}/></div></CardContent></Card>
 {error&&<p role="alert" className="order-builder-alert order-builder-alert-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!outletId?<p>Select a location and outlet to create or view its combos.</p>:loading?<p role="status">Loading outlet combos…</p>:<>
 <Card><CardHeader title={form.comboId?'Edit combo':'Create combo'}/><CardContent><form onSubmit={save}><fieldset disabled={saving} className="combo-form"><Input required maxLength={150} label="Combo name" placeholder="e.g. Deepavali Comfort Combo" value={form.comboName} onChange={event=>update('comboName',event.target.value)}/><div className="combo-product-picker"><GroupedProductPicker searchAll label="Combo product" options={catalogue.products.map(productionOption)} value={line.productId} onChange={productId=>setLine(current=>({...current,productId}))}/><div className="combo-grid"><Input label="Quantity" type="number" min="1" max="10000" step="1" value={line.quantity} onChange={event=>setLine({...line,quantity:event.target.value})}/><Input label="MRP per unit (₹)" type="number" min="0.01" step="0.01" value={line.mrp} onChange={event=>setLine({...line,mrp:event.target.value})}/></div><Button type="button" onClick={add}>Add product to combo</Button></div>
 <div className="combo-lines">{form.items.map((item,index)=><article key={item.productId}><strong>{item.productName || item.productId}</strong><div className="combo-grid"><Input label="Product quantity" type="number" min="1" max="10000" step="1" value={item.quantity} onChange={event=>changeItem(index,'quantity',event.target.value)}/><Input label="Product MRP per unit (₹)" type="number" min="0.01" step="0.01" value={item.mrp} onChange={event=>changeItem(index,'mrp',event.target.value)}/></div><span>Line MRP: {money(Number(item.quantity)*Number(item.mrp))}</span><Button type="button" variant="secondary" onClick={()=>update('items',form.items.filter((_,i)=>i!==index))}>Remove product</Button></article>)}</div>
 <p>Total product MRP: <strong>{money(total(form.items))}</strong></p><Input label="Combo MRP (₹)" type="number" min="0.01" step="0.01" placeholder={`Use product total: ${total(form.items).toFixed(2)}`} value={form.comboMrp} onChange={event=>update('comboMrp',event.target.value)}/><small>Leave blank to use the total product MRP, or enter the MRP offered for this combo.</small><label><input type="checkbox" checked={form.active} onChange={event=>update('active',event.target.checked)}/> Active combo</label><div className="combo-actions"><Button type="submit" disabled={saving || !form.items.length}>{saving?'Saving…':form.comboId?'Save combo':'Create combo'}</Button>{form.comboId&&<Button type="button" variant="secondary" onClick={()=>setForm(fresh())}>Cancel edit</Button>}</div></fieldset></form></CardContent></Card>
 <Card><CardHeader title={`Combos for ${catalogue.outlet?.outletName || outletId}`}/><CardContent><Input label="Search combos" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search by combo name"/><div className="combo-saved">{catalogue.combos.filter(combo=>combo.comboName.toLowerCase().includes(search.toLowerCase())).map(combo=><article key={combo.comboId}><header><h3>{combo.comboName}</h3><span>{combo.active?'Active':'Inactive'}</span></header><p>{catalogue.outlet?.locationName || 'Unassigned location'} · {outletId}</p>{combo.items.map(item=><p key={item.productId}>{item.productName} × {item.quantity} · MRP {money(item.mrp)} each</p>)}<p>Product total: {money(combo.productsMrp)}<br/><strong>Combo MRP: {money(combo.comboMrp)}</strong></p><Button variant="secondary" disabled={saving} onClick={()=>{setForm({...combo,comboMrp:String(combo.comboMrp)});setError('');window.scrollTo({top:0,behavior:'smooth'});}}>Edit combo</Button></article>)}</div>{!catalogue.combos.length&&<p>No combos created for this outlet yet.</p>}</CardContent></Card></>}
 </div>;
}
