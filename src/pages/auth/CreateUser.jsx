import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Building2, LockKeyhole, UserPlus, UsersRound } from 'lucide-react';
import { createManagerEmployee, fetchOutlets } from '../../api/employees';
import './CreateUser.css';

const emptyForm = { name: '', phone: '', password: '', outletId: '', role: 'EMPLOYEE', workType: 'OFFICE', salaryModel: 'MONTHLY', basicSalary: '', perDayRate: '', overtimeRate: '0' };

const CreateUser = () => {
  const [form, setForm] = useState(emptyForm);
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchOutlets().then((data) => setOutlets(data?.outlets || data?.data || [])).catch(() => setError('Unable to load outlets. Please refresh and try again.'));
  }, []);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const monthly = form.salaryModel === 'MONTHLY';
  const outletOptions = [{ value: '', label: outlets.length ? 'Select an outlet' : 'Loading outlets…' }, ...outlets.map((outlet) => ({ value: outlet.outletId || outlet.id, label: `${outlet.outletName || outlet.name || 'Outlet'} (${outlet.outletId || outlet.id})` }))];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.phone || !form.password || !form.outletId || (monthly && !form.basicSalary) || (!monthly && !form.perDayRate)) {
      setError('Enter the employee details, assigned outlet, and the selected salary rate.');
      return;
    }
    setError(''); setSuccessMsg(''); setIsLoading(true);
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim(), password: form.password, outletId: form.outletId, role: form.role, workType: form.workType, salaryModel: form.salaryModel, overtimeRate: Number(form.overtimeRate || 0), ...(monthly ? { basicSalary: Number(form.basicSalary) } : { perDayRate: Number(form.perDayRate) }) };
      const result = await createManagerEmployee(payload);
      setSuccessMsg(`${result?.message || 'Employee created successfully.'} Login username: ${result?.loginUsername || form.phone.trim()}`);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Unable to create the employee.');
    } finally { setIsLoading(false); }
  };

  return <main className="create-user-page">
    <section className="create-user-intro"><div className="create-user-intro-icon"><UsersRound size={22} /></div><div><p className="create-user-eyebrow">Team management</p><h2>Add an employee</h2><p>Create one staff login and link it to the outlet where the employee works.</p></div></section>
    <div className="create-user-layout"><Card className="create-user-card"><CardHeader title="Employee details" /><CardContent>
      {error && <div className="create-user-alert create-user-alert-error" role="alert">{error}</div>}
      {successMsg && <div className="create-user-alert create-user-alert-success" role="status">{successMsg}</div>}
      <form onSubmit={handleSubmit} className="create-user-form">
        <Input label="Employee name" placeholder="e.g. Arun Kumar" value={form.name} onChange={update('name')} disabled={isLoading} />
        <Input label="Phone / login username" placeholder="e.g. 9876543210" value={form.phone} onChange={update('phone')} disabled={isLoading} />
        <Input label="Temporary password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} disabled={isLoading} />
        <Select label="Assigned outlet" value={form.outletId} onChange={update('outletId')} options={outletOptions} disabled={isLoading || !outlets.length} />
        <fieldset className="create-user-role-picker" disabled={isLoading}><legend><span>2</span><div><strong>Employee role</strong><small>Godown staff can receive and dispatch stock assigned to their godown.</small></div></legend><div className="create-user-role-options">{['EMPLOYEE', 'CASHIER', 'SUPERVISOR', 'GODOWN'].map((role) => <button key={role} type="button" className={`create-user-role-option ${form.role === role ? 'selected' : ''}`} onClick={() => setForm((current) => ({ ...current, role }))}><UsersRound size={19} /><span><strong>{role === 'GODOWN' ? 'Godown operator' : role.charAt(0) + role.slice(1).toLowerCase()}</strong><small>Assigned to the selected location</small></span></button>)}</div></fieldset>
        <fieldset className="create-user-role-picker" disabled={isLoading}><legend><span>3</span><div><strong>Work type</strong><small>Office staff must be within the outlet's 100-metre attendance boundary. Field staff can mark attendance from the field with a required selfie.</small></div></legend><div className="create-user-role-options">{[{ value: 'OFFICE', title: 'Office employee', note: '100-metre outlet boundary applies' }, { value: 'FIELD', title: 'Field work employee', note: 'Selfie required; no outlet distance restriction' }].map((type) => <button key={type.value} type="button" className={`create-user-role-option ${form.workType === type.value ? 'selected' : ''}`} onClick={() => setForm((current) => ({ ...current, workType: type.value }))}><UsersRound size={19} /><span><strong>{type.title}</strong><small>{type.note}</small></span></button>)}</div></fieldset>
        <Select label="Salary model" value={form.salaryModel} onChange={update('salaryModel')} options={[{ value: 'MONTHLY', label: 'Monthly salary' }, { value: 'PER_DAY', label: 'Per-day salary' }]} disabled={isLoading} />
        {monthly ? <Input label="Basic monthly salary" type="number" min="0" value={form.basicSalary} onChange={update('basicSalary')} disabled={isLoading} /> : <Input label="Per-day rate" type="number" min="0" value={form.perDayRate} onChange={update('perDayRate')} disabled={isLoading} />}
        <Input label="Overtime hourly rate" type="number" min="0" value={form.overtimeRate} onChange={update('overtimeRate')} disabled={isLoading} />
        <Button type="submit" variant="primary" className="create-user-submit" disabled={isLoading}><UserPlus size={18} />{isLoading ? 'Creating employee…' : 'Create employee login'}</Button>
      </form>
    </CardContent></Card><aside className="create-user-guidance"><div className="create-user-guidance-icon"><Building2 size={20} /></div><h3>One employee workspace</h3><p>Employees can mark attendance, create and review outlet orders, view stock, and run their outlet reports.</p><div className="create-user-role"><LockKeyhole size={18} /><div><strong>Outlet-scoped access</strong><span>Every employee is restricted to the outlet selected here.</span></div></div></aside></div>
  </main>;
};

export default CreateUser;
