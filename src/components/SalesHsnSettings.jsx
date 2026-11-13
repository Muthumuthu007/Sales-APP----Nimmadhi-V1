import React,{useCallback,useEffect,useState} from 'react';
import api from '../api/axios';
import {Modal} from './ui/Modal';
import {Button} from './ui/Button';

export default function SalesHsnSettings({isOpen,onClose,onSaved}){
 const [config,setConfig]=useState(null),[codes,setCodes]=useState({}),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[conflict,setConflict]=useState(false);
 const load=useCallback(async()=>{
  setLoading(true);setError('');setConflict(false);
  try{const result=await api.get('/manager/sales-record/hsn-settings');setConfig(result);setCodes(Object.fromEntries(result.groups.map(g=>[g.groupId,g.hsnCode])));}
  catch(err){setError(err.response?.data?.error || 'Unable to load HSN codes. Try again.');setConfig(null);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(isOpen)load();},[isOpen,load]);
 const save=async e=>{
  e.preventDefault();setSaving(true);setError('');setConflict(false);
  try{const result=await api.post('/manager/sales-record/hsn-settings',{expectedVersion:config.version,codes});onSaved(result);}
  catch(err){setError(err.response?.data?.error || 'Save could not be confirmed. Retry with the same values to check safely.');setConflict(err.response?.status===409);}
  finally{setSaving(false);}
 };
 return <Modal isOpen={isOpen} onClose={()=>!saving&&onClose()} title="Edit HSN codes">
 <p className="asr-muted">These codes apply to all outlets and dates in Sales Record and Excel exports. Sale prices, tax rates, and tax amounts stay unchanged. Bare remains blank.</p>
 {error&&<p className="asr-notice" role="alert">{error}</p>}
 {loading?<p role="status">Loading HSN codes…</p>:config?<form onSubmit={save} className="asr-hsn-form">
 {!config.canEdit&&<p className="asr-notice">Only the main admin can edit these global settings.</p>}
 <fieldset disabled={saving||!config.canEdit} className="asr-hsn-fields">{config.groups.map(group=><label key={group.groupId}>{group.groupName}<input aria-label={`HSN code for ${group.groupName}`} type="text" inputMode="numeric" maxLength={8} pattern="(?:[0-9]{4}|[0-9]{6}|[0-9]{8})?" title="Enter 4, 6, or 8 digits, or leave blank" value={codes[group.groupId] || ''} onChange={e=>setCodes({...codes,[group.groupId]:e.target.value})} placeholder="Unassigned"/></label>)}</fieldset>
 <small>Leave a field blank to keep that group unassigned. Changes also apply to its subgroups.</small>
 {config.updatedAt&&<p className="asr-muted">Last saved {new Date(config.updatedAt).toLocaleString()} by {config.updatedBy}.</p>}
 <div className="asr-hsn-actions"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>{conflict&&<Button type="button" variant="secondary" onClick={load}>Reload latest values</Button>}{config.canEdit&&<Button type="submit" disabled={saving||conflict}>{saving?'Saving…':'Save HSN codes'}</Button>}</div>
 </form>:<Button variant="secondary" onClick={load}>Try again</Button>}
 </Modal>;
}
