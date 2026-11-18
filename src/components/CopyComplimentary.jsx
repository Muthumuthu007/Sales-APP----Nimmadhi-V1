import ProductListBlocks from './ProductListBlocks';
import ProductMrp from './ProductMrp';
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {fetchOutletOffers, copyOutletOffers, startComplimentaryCopyJob, fetchComplimentaryCopyJobs, fetchComplimentaryCopyJob, retryComplimentaryCopyJob} from '../api/offers';
import {complimentaryProductGroups} from '../utils/complimentaryProductGroups';
import {Card, CardHeader, CardContent} from './ui/Card';
import {Button} from './ui/Button';
import {Input} from './ui/Input';

export default function CopyComplimentary({outlets, onCopied}) {
 const [jobs,setJobs]=useState([]),[jobError,setJobError]=useState(''),[jobDetails,setJobDetails]=useState({}),[pendingJob,setPendingJob]=useState(null);
 const jobPanel=useRef(null);
 const requestId=useRef(null),statuses=useRef(new Map()),jobRequest=useRef(0);
 const loadJobs=useCallback(async()=>{const current=++jobRequest.current;try{const result=await fetchComplimentaryCopyJobs();if(current!==jobRequest.current)return;const rows=result.jobs||[];for(const job of rows){if(job.status==='COMPLETED' && statuses.current.has(job.jobId) && statuses.current.get(job.jobId)!=='COMPLETED')onCopied?.();statuses.current.set(job.jobId,job.status);}setJobs(rows);setJobError('');}catch{if(current!==jobRequest.current)return;setJobError('Unable to refresh copy progress. Saved jobs continue in the background.');}},[onCopied]);
 const invalidateJobs=useCallback(()=>{jobRequest.current++;},[]);
 useEffect(()=>{void loadJobs();const timer=setInterval(loadJobs,3000);return()=>{clearInterval(timer);invalidateJobs();};},[loadJobs,invalidateJobs]);
 const retryJob=async(id)=>{setPendingJob(id);try{await retryComplimentaryCopyJob(id);await loadJobs();}catch(e){setJobError(e.response?.data?.error || 'Unable to retry this job.');}finally{setPendingJob(null);}};
 const viewResult=async(id)=>{try{const result=await fetchComplimentaryCopyJob(id);setJobDetails(old=>({...old,[id]:result}));}catch{setJobError('Unable to load copy result details.');}};
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
 const choose=(pid)=>{requestId.current=null;setPreview(null);setSelected(current=>current.includes(pid)?current.filter(id=>id!==pid):[...current,pid]);setMessage('');};
 const copy=async(confirm=false)=>{setBusy(true);setError('');setMessage('');try{
  const payload={fromOutletId:source,toOutletId:destination,ruleType:'COMPLIMENTARY',productIds:selected};
  if(confirm){
   requestId.current ||= crypto.randomUUID();
   const job=await startComplimentaryCopyJob({...payload,previewToken:preview.previewToken,requestId:requestId.current});
   if(job.status==='COMPLETED')onCopied?.();statuses.current.set(job.jobId,job.status);setJobs(old=>[job,...old.filter(row=>row.jobId!==job.jobId)]);
   setPreview(null);setSelected([]);requestId.current=null;
   setMessage('Copy request saved. See progress and results below. You can safely leave this page.');requestAnimationFrame(()=>jobPanel.current?.scrollIntoView({block:'start'}));
  }else{setPreview(await copyOutletOffers(payload));requestId.current=null;}
 }catch(e){setError(e.response?.data?.error || 'Unable to confirm the copy. Retry with the same selection, or check saved jobs below.');if(confirm)void loadJobs();}finally{setBusy(false);}};
 const visible=products.filter(p=>(p.productName || '').toLowerCase().includes(search.toLowerCase()));
 return <Card className="offers-copy"><CardHeader title="Copy complimentary offers between outlets"/><CardContent>
 <fieldset className="offers-form" disabled={busy}>
 <div className="offers-value-grid"><label>Copy from outlet<select value={source} onChange={e=>setSource(e.target.value)}><option value="">Select source outlet</option>{outlets.map(o=><option key={o.outletId} value={o.outletId}>{o.outletName} — {o.outletId}</option>)}</select></label>
 <label>Copy to outlet<select value={destination} onChange={e=>{setDestination(e.target.value);setPreview(null);setMessage('');}}><option value="">Select destination outlet</option>{outlets.filter(o=>o.outletId!==source).map(o=><option key={o.outletId} value={o.outletId}>{o.outletName} — {o.outletId}</option>)}</select></label></div>
 <p className="offers-help">Select products to copy all their complimentary items. Matching item quantities will update at the destination; different items will remain. Large selections are copied automatically in safe batches.</p>
 {loading?<p>Loading source offers…</p>:source&&<>
 <Input label="Find products to copy" type="search" value={search} onChange={e=>setSearch(e.target.value)}/>
 <div className="offer-rule-actions"><Button variant="secondary" onClick={()=>{setSelected(products.map(p=>p.productId));setPreview(null);}}>Select all</Button><Button variant="secondary" onClick={()=>{setSelected([]);setPreview(null);}}>Clear selection</Button><span>{selected.length} selected</span></div>
 <div className="offer-product-checklist"><ProductListBlocks items={visible} renderItem={p=><label className="offer-product-option" key={p.productId}><input type="checkbox" checked={selected.includes(p.productId)} onChange={()=>choose(p.productId)}/><span>{p.productName}<ProductMrp item={p}/><small className="offer-current-assignment">{p.offers.map(r=>`${r.freeProductName || r.freeProductId} × ${r.freeQuantity}`).join(', ')}</small></span></label>}/>{!visible.length&&<p>No assigned complimentary products found.</p>}</div></>}
 {error&&<p role="alert" className="offers-alert offers-alert-error">{error}</p>}{message&&<p role="status" className="offers-alert offers-alert-success">{message}</p>}
 <Button disabled={busy||loading||!selected.length||!destination||source===destination} onClick={()=>copy()}>Preview copy</Button>
 {preview&&<section aria-label="Copy preview"><h3>Review before copying</h3><p>{preview.products.length} products will be copied to {outlets.find(o=>o.outletId===destination)?.outletName || destination}.</p>
 <div className="offer-product-checklist"><ProductListBlocks items={preview.products} renderItem={p=><article key={p.productId}><strong>{p.productName}</strong><ProductMrp item={p}/><p>{p.items.map(i=>`${i.freeProductName} × ${i.freeQuantity}`).join(', ')}</p></article>}/></div>
 {preview.skipped.length>0&&<><h4>Skipped items</h4><ProductListBlocks items={preview.skipped} renderItem={(p,i)=><p key={`${p.productId}-${i}`}>{p.productName}: {p.reason}</p>}/></>}
 <Button variant="primary" disabled={busy||!preview.products.length} onClick={()=>copy(true)}>{busy?'Starting copy…':'Confirm copy'}</Button></section>}
 </fieldset>
 <section ref={jobPanel} className="copy-job-history" aria-label="Saved complimentary copy jobs"><h3>Copy progress and results</h3><p>Copies continue on the server if you leave this page. Completed batches are kept when a job is retried.</p><Button variant="secondary" onClick={loadJobs}>Refresh progress</Button>{jobError&&<p role="alert">{jobError}</p>}{!jobs.length&&<p>No saved copy jobs yet.</p>}
 {jobs.map(job=><article key={job.jobId} className="copy-job-card"><header><strong>{job.fromOutletId} → {job.toOutletId}</strong><span>{job.status==='COMPLETED'?'Completed':job.status==='FAILED'?'Needs attention':job.status==='PREPARING'?'Preparing':'Copying'}</span></header><small>{new Date(Number(job.createdAt)*1000).toLocaleString('en-IN')}</small><p role="status">{job.copiedProducts} of {job.totalProducts} eligible products copied · {job.skippedCount} skipped</p><progress aria-label={`Copy progress ${job.fromOutletId} to ${job.toOutletId}`} value={job.completedProducts} max={job.totalProducts || 1}/><p>{Math.max(0,job.totalProducts-job.completedProducts)} remaining</p>{job.error&&<p role="alert">{job.error}</p>}{job.status==='FAILED'&&job.retryable&&<Button disabled={pendingJob===job.jobId} onClick={()=>retryJob(job.jobId)}>Retry remaining products</Button>}<Button variant="secondary" onClick={()=>viewResult(job.jobId)}>View result details</Button>
 {jobDetails[job.jobId]&&<div><h4>Skipped items</h4>{!jobDetails[job.jobId].skipped?.length?<p>None.</p>:jobDetails[job.jobId].skipped.map((item,index)=><p key={index}>{item.productName || item.productId}: {item.reason}</p>)}{!!jobDetails[job.jobId].failedProducts?.length&&<><h4>Interrupted batch</h4>{jobDetails[job.jobId].failedProducts.map(item=><p key={item.productId}>{item.productName}: {item.reason}</p>)}</>}</div>}</article>)}
 </section></CardContent></Card>;
}
