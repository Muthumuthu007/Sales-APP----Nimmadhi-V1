import ProductMrp from './ProductMrp';
import React, {useEffect, useState} from 'react';
import {fetchOutletOffers, copyOutletOffers} from '../api/offers';
import {complimentaryProductGroups} from '../utils/complimentaryProductGroups';
import {Card, CardHeader, CardContent} from './ui/Card';
import {Button} from './ui/Button';
import {Input} from './ui/Input';

export default function CopyComplimentary({outlets, onCopied}) {
 const [source,setSource]=useState('');const [destination,setDestination]=useState('');
 const [products,setProducts]=useState([]);const [selected,setSelected]=useState([]);
 const [preview,setPreview]=useState(null);const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');const [message,setMessage]=useState('');const [search,setSearch]=useState('');
 useEffect(()=>{let active=true;setProducts([]);setSelected([]);setPreview(null);setError('');setMessage('');
  if(!source){setLoading(false);return;}setLoading(true);
  fetchOutletOffers(source,'COMPLIMENTARY').then(data=>{if(active)setProducts(complimentaryProductGroups(data.products || [],data.offers || []).products);})
   .catch(()=>{if(active)setError('Unable to load source offers.');}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[source]);
 const choose=(pid)=>{setPreview(null);setSelected(current=>current.includes(pid)?current.filter(id=>id!==pid):[...current,pid]);setMessage('');};
 const copy=async(confirm=false)=>{setBusy(true);setError('');setMessage('');try{
  const result=await copyOutletOffers({fromOutletId:source,toOutletId:destination,ruleType:'COMPLIMENTARY',productIds:selected,...(confirm?{confirm:true,previewToken:preview.previewToken}:{})});
  if(confirm){setPreview(null);setSelected([]);setMessage(`Copied complimentary items for ${result.copiedProducts} products.`);onCopied?.();}else setPreview(result);
 }catch(e){setPreview(null);setError(e.response?.data?.error || 'Unable to copy complimentary items.');}finally{setBusy(false);}};
 const visible=products.filter(p=>(p.productName || '').toLowerCase().includes(search.toLowerCase()));
 return <Card className="offers-copy"><CardHeader title="Copy complimentary offers between outlets"/><CardContent>
 <fieldset className="offers-form" disabled={busy}>
 <div className="offers-value-grid"><label>Copy from outlet<select value={source} onChange={e=>setSource(e.target.value)}><option value="">Select source outlet</option>{outlets.map(o=><option key={o.outletId} value={o.outletId}>{o.outletName} — {o.outletId}</option>)}</select></label>
 <label>Copy to outlet<select value={destination} onChange={e=>{setDestination(e.target.value);setPreview(null);setMessage('');}}><option value="">Select destination outlet</option>{outlets.filter(o=>o.outletId!==source).map(o=><option key={o.outletId} value={o.outletId}>{o.outletName} — {o.outletId}</option>)}</select></label></div>
 <p className="offers-help">Select products to copy all their complimentary items. Matching item quantities will update at the destination; different items will remain.</p>
 {loading?<p>Loading source offers…</p>:source&&<>
 <Input label="Find products to copy" type="search" value={search} onChange={e=>setSearch(e.target.value)}/>
 <div className="offer-rule-actions"><Button variant="secondary" onClick={()=>{setSelected(products.map(p=>p.productId));setPreview(null);}}>Select all</Button><Button variant="secondary" onClick={()=>{setSelected([]);setPreview(null);}}>Clear selection</Button><span>{selected.length} selected</span></div>
 <div className="offer-product-checklist">{visible.map(p=><label className="offer-product-option" key={p.productId}><input type="checkbox" checked={selected.includes(p.productId)} onChange={()=>choose(p.productId)}/><span>{p.productName}<ProductMrp item={p}/><small className="offer-current-assignment">{p.offers.map(r=>`${r.freeProductName || r.freeProductId} × ${r.freeQuantity}`).join(', ')}</small></span></label>)}{!visible.length&&<p>No assigned complimentary products found.</p>}</div></>}
 {error&&<p role="alert" className="offers-alert offers-alert-error">{error}</p>}{message&&<p role="status" className="offers-alert offers-alert-success">{message}</p>}
 <Button disabled={busy||loading||!selected.length||!destination||source===destination} onClick={()=>copy()}>Preview copy</Button>
 {preview&&<section aria-label="Copy preview"><h3>Review before copying</h3><p>{preview.products.length} products will be copied to {outlets.find(o=>o.outletId===destination)?.outletName || destination}.</p>
 <div className="offer-product-checklist">{preview.products.map(p=><article key={p.productId}><strong>{p.productName}</strong><ProductMrp item={p}/><p>{p.items.map(i=>`${i.freeProductName} × ${i.freeQuantity}`).join(', ')}</p></article>)}</div>
 {preview.skipped.length>0&&<><h4>Skipped items</h4>{preview.skipped.map((p,i)=><p key={`${p.productId}-${i}`}>{p.productName}: {p.reason}</p>)}</>}
 <Button variant="primary" disabled={busy||!preview.products.length} onClick={()=>copy(true)}>{busy?'Copying…':'Confirm copy'}</Button></section>}
 </fieldset></CardContent></Card>;
}
