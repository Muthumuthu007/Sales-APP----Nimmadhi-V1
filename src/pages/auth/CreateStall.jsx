import React,{useEffect,useState} from 'react';
import api from '../../api/axios';
import {Card,CardHeader,CardContent} from '../../components/ui/Card';
import {Input,Select} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
const empty={name:'',username:'',password:'',linkedOutletId:''};
export default function CreateStall(){
 const [form,setForm]=useState(empty),[outlets,setOutlets]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{api.get('/outlets').then(data=>setOutlets((data.outlets || []).filter(row=>String(row.outletId).startsWith('NIM') && row.locationType!=='STALL' && row.locationType!=='GODOWN'))).catch(()=>setError('Unable to load linked outlets.'));},[]);
 const field=key=>e=>setForm({...form,[key]:e.target.value});
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{const data=await api.post('/manager/stalls',form);setMessage(`Stall ${data.stall.outletName} created. Login: ${data.username}. Linked outlet: ${data.stall.linkedOutletId}.`);setForm(empty);}catch(err){setError(err.response?.data?.error || err.response?.data?.detail || 'Unable to create stall. Check the fields and username.');}finally{setBusy(false);}};
 return <Card><CardHeader title="Create festival stall login"/><CardContent><p>A stall has its own stock and sales, linked to an existing own outlet.</p>{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}<form onSubmit={submit} style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))'}}>
 <Input label="Stall name" required value={form.name} onChange={field('name')} disabled={busy}/><Input label="Stall login username" required value={form.username} onChange={field('username')} disabled={busy}/><Input label="Stall password" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={field('password')} disabled={busy}/><Select label="Linked own outlet" required value={form.linkedOutletId} onChange={field('linkedOutletId')} options={[{value:'',label:'Choose linked outlet'},...outlets.map(row=>({value:row.outletId,label:`${row.outletName} (${row.outletId})`}))]} disabled={busy}/><Button type="submit" disabled={busy}>{busy?'Creating…':'Create stall login'}</Button></form></CardContent></Card>;
}
