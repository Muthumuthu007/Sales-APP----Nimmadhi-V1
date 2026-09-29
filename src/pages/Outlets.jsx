import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Plus, UsersRound } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateContainers';
import { createOutlet, fetchOutlets } from '../api/employees';
import './Outlets.css';

const emptyForm = { outletId: '', outletName: '', address: '', phone: '' };

const Outlets = () => {
  const [outlets, setOutlets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadOutlets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchOutlets();
      setOutlets(response?.outlets || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to load outlets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOutlets(); }, []);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.outletId.trim() || !form.outletName.trim()) {
      setError('Enter both an Outlet ID and outlet name.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await createOutlet({
        outletId: form.outletId.trim().toUpperCase(),
        outletName: form.outletName.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      });
      setSuccess(`${result?.outlet?.outletName || form.outletName} created. You can now create employee logins for this outlet.`);
      setForm(emptyForm);
      await loadOutlets();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.outletId?.[0] || 'Unable to create the outlet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="outlets-page">
      <section className="outlets-intro">
        <div className="outlets-intro-icon"><Building2 size={22} /></div>
        <div><p className="outlets-eyebrow">Outlet administration</p><h2>Outlets</h2><p>Create an outlet once, then assign employees, orders, load plans, and dispatches to it.</p></div>
      </section>
      <div className="outlets-layout">
        <Card className="outlets-create-card">
          <CardHeader title="Create outlet" />
          <CardContent>
            {error && <div className="outlets-alert outlets-alert-error" role="alert">{error}</div>}
            {success && <div className="outlets-alert outlets-alert-success" role="status">{success}</div>}
            <form className="outlets-form" onSubmit={handleSubmit}>
              <Input label="Outlet ID" placeholder="e.g. OUT010" value={form.outletId} onChange={update('outletId')} disabled={saving} />
              <Input label="Outlet name" placeholder="e.g. Chennai Silks – Thiruvallur" value={form.outletName} onChange={update('outletName')} disabled={saving} />
              <Input label="Address (optional)" placeholder="Store address" value={form.address} onChange={update('address')} disabled={saving} />
              <Input label="Phone (optional)" placeholder="Store contact number" value={form.phone} onChange={update('phone')} disabled={saving} />
              <Button type="submit" variant="primary" className="outlets-submit" disabled={saving}><Plus size={18} />{saving ? 'Creating outlet…' : 'Create outlet'}</Button>
            </form>
          </CardContent>
        </Card>
        <aside className="outlets-guidance">
          <UsersRound size={21} /><h3>Next step: assign staff</h3>
          <p>After creating the outlet, use Create User to add employee logins under the correct outlet.</p>
          <Link to="/create-user" className="outlets-link">Create employee login</Link>
        </aside>
      </div>
      <Card>
        <CardHeader title={`Registered outlets (${outlets.length})`} />
        <CardContent>
          {loading ? <LoadingState /> : error && !outlets.length ? <ErrorState error={error} onRetry={loadOutlets} /> : !outlets.length ? <EmptyState title="No outlets created yet." /> : (
            <div className="outlet-directory">
              {outlets.map((outlet) => <article className="outlet-directory-card" key={outlet.outletId}>
                <div className="outlet-directory-header"><span>{outlet.outletId}</span><Building2 size={19} /></div>
                <h3>{outlet.outletName || outlet.outletId}</h3>
                <p><MapPin size={15} />{outlet.address || 'Address not added'}</p>
                <p><Phone size={15} />{outlet.phone || 'Phone not added'}</p>
              </article>)}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Outlets;
