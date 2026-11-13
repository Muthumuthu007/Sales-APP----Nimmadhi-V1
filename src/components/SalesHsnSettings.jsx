import React,{useCallback,useEffect,useState} from 'react';
import api from '../api/axios';
import {Modal} from './ui/Modal';
import {Button} from './ui/Button';

export default function SalesHsnSettings({isOpen,onClose,onSaved}){
 const [config,setConfig]=useState(null),[codes,setCodes]=useState({}),[taxRates,setTaxRates]=useState({}),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[conflict,setConflict]=useState(false),[search,setSearch]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');setConflict(false);setSearch('');
  try{const result=await api.get('/manager/sales-record/hsn-settings');setConfig(result);setCodes(Object.fromEntries(result.groups.map(g=>[g.groupId,g.hsnCode])));setTaxRates(Object.fromEntries(result.groups.map(g=>[g.groupId,g.taxPercent ?? ''])));}
  catch(err){setError(err.response?.data?.error || 'Unable to load HSN codes. Try again.');setConfig(null);}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(isOpen)load();},[isOpen,load]);
 const save=async e=>{
  e.preventDefault();setSaving(true);setError('');setConflict(false);
  try{const result=await api.post('/manager/sales-record/hsn-settings',{expectedVersion:config.version,codes,taxRates});onSaved(result);}
  catch(err){setError(err.response?.data?.error || 'Save could not be confirmed. Retry with the same values to check safely.');setConflict(err.response?.status===409);}
  finally{setSaving(false);}
 };
 const mattresses=(config?.groups || []).filter(g=>g.section==='MATTRESS');
 const accessories=(config?.groups || []).filter(g=>g.section==='ACCESSORIES');
 const visibleAccessories=accessories.filter(g=>(g.groupPath || g.groupName).toLowerCase().includes(search.toLowerCase()));
 const field=group=><div className="asr-hsn-row" key={group.groupId}><strong>{group.groupPath || group.groupName}</strong><label>HSN code<input aria-label={`HSN code for ${group.groupPath || group.groupName}`} type="text" inputMode="numeric" maxLength={8} pattern="(?:[0-9]{4}|[0-9]{6}|[0-9]{8})?" title="Enter 4, 6, or 8 digits, or leave blank" value={codes[group.groupId] || ''} onChange={e=>setCodes({...codes,[group.groupId]:e.target.value})} placeholder="Unassigned"/></label><label>Tax (%)<input aria-label={`Tax rate for ${group.groupPath || group.groupName}`} type="number" min="0" max="100" step="0.01" value={taxRates[group.groupId] ?? ''} onChange={e=>setTaxRates({...taxRates,[group.groupId]:e.target.value})} placeholder="Not configured"/></label></div>;
 return <Modal isOpen={isOpen} onClose={()=>!saving&&onClose()} title="Edit HSN codes & tax rates">
 <p className="asr-muted">HSN labels apply to Sales Record and Excel exports. Tax-rate changes apply only to new sales after saving. Existing bills and their recorded taxes stay unchanged. Bare HSN remains blank.</p>
 {error&&<p className="asr-notice" role="alert">{error}</p>}
 {loading?<p role="status">Loading HSN codes…</p>:config?<form onSubmit={save} className="asr-hsn-form">
 {!config.canEdit&&<p className="asr-notice">Only the main admin can edit these global settings.</p>}
 <fieldset disabled={saving||!config.canEdit} className="asr-hsn-section"><legend>Mattress — one shared HSN code and tax rate</legend><p className="asr-muted">Applies to every mattress subgroup.</p>{mattresses.map(field)}</fieldset>
 <section><h4>Accessories — {accessories.length} subgroups</h4><p className="asr-muted">Each subgroup can have its own HSN code and tax rate. Existing effective codes are shown below; unassigned codes are blank.</p><label className="asr-hsn-search">Find an accessory subgroup<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pillows, protector, slim bed…"/></label>
 <fieldset disabled={saving||!config.canEdit} className="asr-hsn-accessories">{visibleAccessories.map(field)}{!visibleAccessories.length&&<p>No accessory subgroups match your search.</p>}</fieldset></section>
 <small>Blank HSN means unassigned. Blank tax keeps the existing sale-entry default; 0% is an explicit zero-tax rate. Bare HSN remains blank.</small>
 {config.updatedAt&&<p className="asr-muted">Last saved {new Date(config.updatedAt).toLocaleString()} by {config.updatedBy}.</p>}
 <div className="asr-hsn-actions"><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>{conflict&&<Button type="button" variant="secondary" onClick={load}>Reload latest values</Button>}{config.canEdit&&<Button type="submit" disabled={saving||conflict}>{saving?'Saving…':'Save HSN & tax settings'}</Button>}</div>
 </form>:<Button variant="secondary" onClick={load}>Try again</Button>}
 </Modal>;
}
