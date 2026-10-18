import React, {useEffect, useRef, useState} from 'react';
import api from '../api/axios';
import GroupedProductPicker from './GroupedProductPicker';
import {productionOption} from '../utils/productHierarchy';
import {Card, CardHeader, CardContent} from './ui/Card';
import {Input, Select} from './ui/Input';
import {Button} from './ui/Button';
import {Table} from './ui/Table';

export default function GodownCustody({stockView = false}) {
 const [holdings,setHoldings]=useState([]),[outlets,setOutlets]=useState([]),[products,setProducts]=useState([]);
 const [destination,setDestination]=useState(''),[product,setProduct]=useState(''),[quantity,setQuantity]=useState('1'),[direction,setDirection]=useState('IN');
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const requestId=useRef(null);
 const load=async()=>{setLoading(true);setError('');try{const [data,catalogue]=await Promise.all([api.get('/godown/custody'),api.get('/products')]);setHoldings(data.holdings||[]);setOutlets(data.outlets||[]);setProducts((catalogue.products||[]).map(productionOption));}catch{setError('Unable to load temporary goods. Please retry.');}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const change=(setter,value)=>{requestId.current=null;setter(value);setNotice('');};
 const submit=async event=>{event.preventDefault();const count=Number(quantity);if(!destination||!product||!Number.isSafeInteger(count)||count<1){setError('Select the destination outlet, product and a positive whole quantity.');return;}setBusy(true);setError('');requestId.current ||= crypto.randomUUID();try{await api.post('/godown/custody',{destinationOutletId:destination,productId:product,quantity:count,direction,requestId:requestId.current});requestId.current=null;setNotice(direction==='IN'?'Temporary goods received. Godown own stock is unchanged.':'Temporary goods released. Godown own stock is unchanged.');setQuantity('1');await load();}catch(err){setError(err.response?.data?.error||'Unable to save. Retry with the same details to safely check this movement.');}finally{setBusy(false);}};
 const visible=direction==='OUT'?products.filter(p=>holdings.some(h=>h.destinationOutletId===destination&&h.productId===p.value&&Number(h.quantity)>0)):products;
 return <Card><CardHeader title={stockView?'Temporary goods held for outlets':'Product In — Temporary outlet goods'} action={<Button variant="secondary" onClick={load} disabled={busy||loading}>Refresh</Button>}/><CardContent>
 <p>These goods belong to the destination outlet and are excluded from available godown stock. Release them here when they leave the godown.</p>
 {loading&&<p role="status">Loading…</p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!loading&&<form onSubmit={submit} style={{display:'grid',gap:'1rem',maxWidth:760,marginBottom:'1.5rem'}}>
 <Select label="Movement" value={direction} disabled={busy} onChange={e=>{change(setDirection,e.target.value);setProduct('');}} options={[{value:'IN',label:'Receive temporary goods'},{value:'OUT',label:'Release temporary goods to outlet'}]}/>
 <Select label="Destination outlet — goods belong to" value={destination} disabled={busy} onChange={e=>{change(setDestination,e.target.value);setProduct('');}} options={[{value:'',label:'Select destination outlet…'},...outlets.map(o=>({value:o.outletId,label:`${o.outletName} (${o.outletId})`}))]}/>
 <GroupedProductPicker options={visible} value={product} onChange={v=>change(setProduct,v)} disabled={busy}/>
 <Input label="Quantity" type="number" min="1" step="1" value={quantity} disabled={busy} onChange={e=>change(setQuantity,e.target.value)}/>
 <Button disabled={busy||!destination||!product} type="submit">{busy?'Saving…':direction==='IN'?'Confirm temporary receipt':'Confirm release'}</Button>
 </form>}
 <Table columns={[{key:'destinationOutletName',label:'Destination outlet',render:r=>`${r.destinationOutletName} (${r.destinationOutletId})`},{key:'productName',label:'Product'},{key:'quantity',label:'Quantity held'},{key:'updatedAt',label:'Updated',render:r=>new Date(r.updatedAt).toLocaleString()}]} data={holdings} emptyStateMessage="No temporary goods are held for outlets."/>
 </CardContent></Card>;
}
