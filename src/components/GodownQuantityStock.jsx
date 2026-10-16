import React, {useEffect, useRef, useState} from 'react';
import api from '../api/axios';
import GroupedProductPicker from './GroupedProductPicker';
import {productionOption} from '../utils/productHierarchy';
import {Card, CardContent, CardHeader} from './ui/Card';
import {Input} from './ui/Input';
import {Button} from './ui/Button';

export default function GodownQuantityStock({direction, onSaved}) {
 const [products,setProducts]=useState([]),[stock,setStock]=useState([]),[product,setProduct]=useState(''),[quantity,setQuantity]=useState('1'),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [loadAttempt,setLoadAttempt]=useState(0),[loadError,setLoadError]=useState(''),[stockReady,setStockReady]=useState(false);
 const requestId=useRef(null);
 useEffect(()=>{
  let alive=true;
  setLoading(true);setLoadError('');setStockReady(false);
  Promise.allSettled([api.get('/products'),api.get('/godown/quantity-stock')]).then(([catalogue,inventory])=>{
   if(!alive)return;
   const failures=[];
   if(catalogue.status==='fulfilled')setProducts((catalogue.value.products||[]).map(productionOption));
   else failures.push('Unable to load the product catalogue.');
   if(inventory.status==='fulfilled'){setStock(inventory.value.stock||[]);setStockReady(true);}
   else failures.push('Unable to load godown stock. Stock changes are unavailable until it reloads.');
   setLoadError(failures.join(' '));setLoading(false);
  });
  return()=>{alive=false;};
 },[loadAttempt]);
 const selected=stock.find(row=>row.productId===product);
 const available=Number(selected?.availableQty||0);
 const change=(setter,value)=>{requestId.current=null;setter(value);setNotice('');};
 const submit=async event=>{event.preventDefault();setError('');setNotice('');if(!stockReady){setError('Reload godown stock before saving.');return;}const count=Number(quantity);if(!product||!Number.isSafeInteger(count)||count<1){setError('Select a product and enter a positive whole quantity.');return;}if(direction==='OUT'&&count>available&&!requestId.current){setError('Quantity exceeds available stock.');return;}setBusy(true);requestId.current ||= crypto.randomUUID();try{const result=await api.post('/godown/quantity-stock',{productId:product,quantity:count,direction,requestId:requestId.current});setStock(rows=>[...rows.filter(row=>row.productId!==product),{...selected,...result}]);requestId.current=null;setNotice(`Stock updated. Available quantity: ${result.availableQty}.`);setQuantity('1');onSaved?.();}catch(err){setError(err.response?.data?.error||'Unable to save. Retry to check or complete this movement safely.');try{const inventory=await api.get('/godown/quantity-stock');setStock(inventory.stock||[]);}catch{/* Keep the original error visible. */}}finally{setBusy(false);}};
 return <Card><CardHeader title={direction==='IN'?'Product In':'Sales Out'}/><CardContent><p>{direction==='IN'?'Add products to available godown stock.':'Remove products from godown stock. No bill or payment is created.'}</p>{loadError&&<div role="alert"><p>{loadError}</p><Button type="button" variant="secondary" disabled={busy||loading} onClick={()=>setLoadAttempt(value=>value+1)}>Retry loading</Button></div>}{loading&&<p role="status">Loading products and stock…</p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<form onSubmit={submit} style={{display:'grid',gap:'1rem',maxWidth:'760px'}}><GroupedProductPicker options={products} value={product} onChange={value=>change(setProduct,value)} disabled={busy||loading}/>{product&&stockReady&&<p>Available: <strong>{available}</strong> · Reserved: {Number(selected?.reservedQty||0)}</p>}<Input label="Quantity" type="number" min="1" step="1" value={quantity} disabled={busy||loading} onChange={event=>change(setQuantity,event.target.value)}/><Button type="submit" disabled={busy||loading||!stockReady||!product}>{busy?'Saving…':direction==='IN'?'Confirm product in':'Confirm sales out'}</Button></form></CardContent></Card>;
}
