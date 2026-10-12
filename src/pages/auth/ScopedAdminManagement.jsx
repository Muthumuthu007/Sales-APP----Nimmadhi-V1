import React,{useCallback,useEffect,useState} from 'react';
import api from '../../api/axios';
import {adminModules} from '../../auth/adminAccess';
import {Card,CardHeader,CardContent} from '../../components/ui/Card';
import {Input} from '../../components/ui/Input';
import {Button} from '../../components/ui/Button';
import {Table} from '../../components/ui/Table';
const emptyForm={name:'',username:'',password:'',allowedModules:[],allowedLocations:[]};
const locationLabel=value=>value==='__UNASSIGNED__'?'Unassigned outlets':value;
export default function ScopedAdminManagement(){
 const [form,setForm]=useState(emptyForm),[editing,setEditing]=useState(''),[admins,setAdmins]=useState([]),[locations,setLocations]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{try{const data=await api.get('/manager/admins',{ignoreLocationScope:true});setAdmins(data.admins || []);setLocations(data.locations || []);}catch(err){setError(err.response?.data?.error || 'Unable to load admin permissions.');}},[]);
 useEffect(()=>{load();},[load]);
 const toggle=(field,value)=>setForm(current=>({...current,[field]:current[field].includes(value)?current[field].filter(item=>item!==value):[...current[field],value]}));
 const save=async event=>{
  event.preventDefault();setError('');setMessage('');
  const issues=[];
  if(!form.name.trim())issues.push('Enter the admin name.');
  if(!editing && !form.username.trim())issues.push('Enter the admin login username.');
  if(!editing && form.password.length<8)issues.push('Admin password must contain at least 8 characters.');
  if(!form.allowedModules.length)issues.push('Select at least one allowed module.');
  if(!form.allowedLocations.length)issues.push('Select at least one allowed location.');
  if(issues.length){setError(issues.join(' '));return;}
  setBusy(true);
  try{
   if(editing)await api.patch(`/manager/admins/${encodeURIComponent(editing)}`,{name:form.name.trim(),allowedModules:form.allowedModules,allowedLocations:form.allowedLocations});
   else await api.post('/manager/admins',{...form,name:form.name.trim(),username:form.username.trim()});
   setMessage(editing?'Admin permissions updated immediately. Sign in again to refresh the menu.':'Restricted admin created. They can sign in using the username and password entered here.');setForm(emptyForm);setEditing('');await load();
  }catch(err){setError(err.response?.data?.error || JSON.stringify(err.response?.data || {}) || 'Unable to save admin.');}
  finally{setBusy(false);}
 };
 const changeActive=async admin=>{setBusy(true);setError('');try{await api.patch(`/manager/admins/${encodeURIComponent(admin.username)}`,{isActive:!admin.isActive});setMessage(admin.isActive?'Admin access disabled.':'Admin access enabled.');await load();}catch(err){setError(err.response?.data?.error || 'Unable to change admin access.');}finally{setBusy(false);}};
 const columns=[{key:'name',label:'Admin'},{key:'username',label:'Login username'},{key:'allowedModules',label:'Modules',render:row=>(row.allowedModules || []).map(module=>adminModules.find(item=>item[0]===module)?.[1] || module).join(', ')},{key:'allowedLocations',label:'Locations',render:row=>(row.allowedLocations || []).map(locationLabel).join(', ')},{key:'isActive',label:'Status',render:row=>row.isActive?'Active':'Disabled'},{key:'actions',label:'Actions',render:row=><div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}><Button variant="secondary" disabled={busy} onClick={()=>{setEditing(row.username);setForm({...emptyForm,...row,password:''});setError('');setMessage('');}}>Edit permissions</Button><Button variant="secondary" disabled={busy} onClick={()=>changeActive(row)}>{row.isActive?'Disable access':'Enable access'}</Button></div>}];
 return <div style={{display:'grid',gap:'1.5rem'}}>
 <header><h1>Admin Management</h1><p>Create admin accounts and manage their module and location access.</p></header>
 <Card><CardHeader title={editing?`Edit admin · ${editing}`:'Create restricted admin'} /><CardContent><p>The main admin keeps full access. These admins receive access only to selected modules and outlet locations.</p><form onSubmit={save} style={{display:'grid',gap:'1rem'}}>
 <Input label="Admin name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} disabled={busy} />
 <Input label="Admin login username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} disabled={busy || Boolean(editing)} />
 {!editing && <Input label="Admin password (minimum 8 characters)" type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} disabled={busy} />}
 <fieldset disabled={busy}><legend>Allowed modules</legend><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'0.75rem'}}>{adminModules.map(([id,label])=><label key={id}><input type="checkbox" checked={form.allowedModules.includes(id)} onChange={()=>toggle('allowedModules',id)} /> {label}</label>)}</div></fieldset>
 <fieldset disabled={busy}><legend>Allowed locations</legend><p>Assign city/region names to outlets first in Outlets → Assign location.</p><div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>{locations.map(location=><label key={location}><input type="checkbox" checked={form.allowedLocations.includes(location)} onChange={()=>toggle('allowedLocations',location)} /> {locationLabel(location)}</label>)}</div></fieldset>
 {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
 <div style={{display:'flex',gap:'1rem'}}><Button type="submit" disabled={busy}>{busy?'Saving…':editing?'Save admin permissions':'Create admin login'}</Button>{editing && <Button type="button" variant="secondary" onClick={()=>{setEditing('');setForm(emptyForm);}}>Cancel edit</Button>}</div>
 </form></CardContent></Card>
 <Card><CardHeader title="Restricted admin accounts" /><CardContent><Table columns={columns} data={admins} emptyStateMessage="No restricted admins created yet." /></CardContent></Card>
 </div>;
}
