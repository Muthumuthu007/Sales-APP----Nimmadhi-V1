import React,{useRef,useState} from 'react';
import api from '../api/axios';
import {Button} from './ui/Button';
import {Modal} from './ui/Modal';
import {hasSalesDraftContent} from '../utils/salesDraft';
export default function SalesDraftControls({form,activeDraft,disabled,onSaved,onReset,onRestore}){
 const saveId=useRef(null);
 const [open,setOpen]=useState(false),[rows,setRows]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[deleteId,setDeleteId]=useState('');
 const failure=err=>err.response?.data?.error || 'Unable to update drafts. Your current bill is still on screen. Please retry.';
 const load=async()=>{const data=await api.get('/outlet/sales-drafts');setRows(data.drafts || []);};
 const show=async()=>{setOpen(true);setBusy(true);setError('');try{await load();}catch(err){setError(failure(err));}finally{setBusy(false);}};
 const save=async()=>{
  const id=activeDraft?.draftId || (saveId.current ||= crypto.randomUUID());
  const data=await api.put(`/outlet/sales-drafts/${id}`,{expectedVersion:activeDraft?.version || 0,name:activeDraft?.name || '',form});
  saveId.current=null;onSaved(data.draft);return data.draft;
 };
 const saveAndNew=async()=>{setBusy(true);setError('');try{await save();onReset();}catch(err){setError(failure(err));}finally{setBusy(false);}};
 const resume=async row=>{
  setBusy(true);setError('');
  try{
   // Switching customers never discards the bill currently being entered.
   if(hasSalesDraftContent(form))await save();
   const data=await api.get(`/outlet/sales-drafts/${row.draftId}`);
   onRestore(data.draft);setOpen(false);
  }catch(err){setError(failure(err));}finally{setBusy(false);}
 };
 const remove=async row=>{
  setBusy(true);setError('');try{await api.delete(`/outlet/sales-drafts/${row.draftId}`,{data:{expectedVersion:row.version}});setDeleteId('');await load();}catch(err){setError(failure(err));}finally{setBusy(false);}
 };
 return <div className="sales-drafts-toolbar">
 <div><strong>{activeDraft?`Draft: ${activeDraft.name}`:'Customer bill drafts'}</strong><small>Drafts do not record payments or reserve stock.</small></div>
 <Button variant="secondary" disabled={disabled || busy || !hasSalesDraftContent(form)} onClick={saveAndNew}>{busy&&!open?'Saving…':'Save draft & New bill'}</Button><Button variant="secondary" disabled={disabled || busy} onClick={show}>Saved drafts</Button>
 {error&&!open&&<p role="alert">{error}</p>}
 <Modal isOpen={open} onClose={()=>!busy&&setOpen(false)} title="Saved bill drafts">
 <p>Drafts belong to your login and outlet and can be resumed on another device. Resuming saves your current bill as a draft first. Stock and prices must be reviewed before submitting.</p>
 {error&&<p role="alert">{error}</p>}
 <Button variant="secondary" disabled={busy} onClick={show}>Refresh drafts</Button>
 {busy?<p role="status">Updating drafts…</p>:!rows.length?<p>No saved drafts.</p>:rows.map(row=><section key={row.draftId} className="sales-draft-row"><strong>{row.name}</strong><span>{row.customerName || 'Customer not entered'} · {row.productCount} product line(s)</span><small>Saved {new Date(row.updatedAt).toLocaleString('en-IN')}</small><div><Button disabled={disabled || busy} onClick={()=>resume(row)}>Resume bill</Button>{row.draftId===activeDraft?.draftId?<small>Currently open</small>:deleteId===row.draftId?<><Button variant="secondary" disabled={busy} onClick={()=>remove(row)}>Confirm delete draft</Button><Button variant="secondary" onClick={()=>setDeleteId('')}>Cancel</Button></>:<Button variant="secondary" disabled={busy} onClick={()=>setDeleteId(row.draftId)}>Delete draft</Button>}</div></section>)}
 </Modal></div>;
}
