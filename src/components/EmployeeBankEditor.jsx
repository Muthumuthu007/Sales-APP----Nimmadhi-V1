import React,{useEffect,useState} from 'react';
import {Modal} from './ui/Modal';
import {Input,Select} from './ui/Input';
import {Button} from './ui/Button';
import {fetchEmployeeBank,updateEmployeeBank} from '../api/employees';
const empty={salaryPaymentMethod:'BANK',bankAccountNumber:'',ifscCode:'',bankName:'',bankBranch:'',version:''};
const message=error=>{const data=error.response?.data;return data?.error || data?.detail || (data?Object.entries(data).map(([key,value])=>`${key}: ${Array.isArray(value)?value.join(' '):value}`).join(' '):'Unable to save bank details. Please retry.');};
export default function EmployeeBankEditor({employee,onClose,onSaved}){
 const [form,setForm]=useState(empty),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  if(!employee)return;
  let active=true;setLoading(true);setReady(false);setError('');setForm(empty);
  fetchEmployeeBank(employee.empId,employee.outletId).then(data=>{if(active){setForm({...empty,...data.bank,salaryPaymentMethod:data.bank?.salaryPaymentMethod || 'BANK',version:data.version});setReady(true);}}).catch(err=>{if(active)setError(message(err));}).finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[employee]);
 const update=key=>event=>setForm(current=>({...current,[key]:key==='ifscCode'?event.target.value.toUpperCase():event.target.value}));
 const save=async event=>{
  event.preventDefault();if(!ready)return;setSaving(true);setError('');
  try{await updateEmployeeBank(employee.empId,{...form,outletId:employee.outletId});onSaved(`${employee.name}’s bank details updated.`);}
  catch(err){setError(message(err));}
  finally{setSaving(false);}
 };
 return <Modal isOpen={Boolean(employee)} onClose={()=>{if(!saving)onClose();}} title="Edit employee bank details">
  <p><strong>{employee?.name}</strong> · {employee?.phone}</p>
  {error&&<p role="alert">{error}</p>}
  {loading?<p role="status">Loading bank details…</p>:<form onSubmit={save} style={{display:'grid',gap:'1rem'}}>
   <Select label="Salary payment method" value={form.salaryPaymentMethod} onChange={update('salaryPaymentMethod')} options={[{value:'BANK',label:'Bank transfer'},{value:'CASH',label:'Cash'}]} disabled={saving}/>
   {form.salaryPaymentMethod==='BANK'&&<>
    <Input label="Bank account number" type="text" inputMode="numeric" required maxLength={34} pattern="[0-9]+" value={form.bankAccountNumber} onChange={update('bankAccountNumber')} disabled={saving}/>
    <Input label="IFSC code" required maxLength={11} pattern="[A-Z]{4}0[A-Z0-9]{6}" value={form.ifscCode} onChange={update('ifscCode')} disabled={saving}/>
    <Input label="Bank name" required maxLength={100} value={form.bankName} onChange={update('bankName')} disabled={saving}/>
    <Input label="Bank branch" required maxLength={150} value={form.bankBranch} onChange={update('bankBranch')} disabled={saving}/>
   </>}
   <p>These details will be used for future salary bank exports. Salary amounts and login details stay unchanged.</p>
   <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',flexWrap:'wrap'}}><Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving || !ready}>{saving?'Saving…':'Save bank details'}</Button></div>
  </form>}
 </Modal>;
}
