import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Plus, Trash2, UsersRound } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateContainers';
import { createOutlet, deleteOutlet, fetchOutlets, fetchProductGroups } from '../api/employees';
import './Outlets.css';

const emptyForm = { outletId: '', outletName: '', address: '', phone: '' };

const Outlets = () => {
  const [outlets, setOutlets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [outletToDelete, setOutletToDelete] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [productGroups, setProductGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

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

  useEffect(() => {
    let active = true;
    fetchProductGroups()
      .then((response) => { if (active) setProductGroups(response?.groups || []); })
      .catch(() => { if (active) setError('Unable to load production groups. Please refresh and try again.'); })
      .finally(() => { if (active) setGroupsLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const toggleProductGroup = (groupId) => {
    setSelectedGroupIds((current) => current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.outletId.trim() || !form.outletName.trim()) {
      setError('Enter both an Outlet ID and outlet name.');
      return;
    }
    if (!selectedGroupIds.length) {
      setError('Select at least one production group this outlet is allowed to order.');
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
        allowedGroupIds: selectedGroupIds,
      });
      setSuccess(`${result?.outlet?.outletName || form.outletName} created. You can now create employee logins for this outlet.`);
      setForm(emptyForm);
      setSelectedGroupIds([]);
      await loadOutlets();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.outletId?.[0] || 'Unable to create the outlet.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirmation = (outlet) => {
    setError('');
    setSuccess('');
    setDeleteConfirmation('');
    setOutletToDelete(outlet);
  };

  const handleDelete = async () => {
    if (!outletToDelete || deleteConfirmation.trim().toUpperCase() !== outletToDelete.outletId.toUpperCase()) return;
    setDeleting(true);
    setError('');
    try {
      const result = await deleteOutlet(outletToDelete.outletId);
      setSuccess(`${outletToDelete.outletName || outletToDelete.outletId} deleted. ${result?.deletedEmployeeLogins || 0} employee login(s) and ${result?.deletedHrRecords || 0} HR record(s) were removed.`);
      setOutletToDelete(null);
      setDeleteConfirmation('');
      await loadOutlets();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to delete the outlet.');
    } finally {
      setDeleting(false);
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
              <section className="outlets-product-access" aria-labelledby="product-access-title">
                <div className="outlets-product-access-heading"><div><span id="product-access-title">Product access</span><small>Select the production groups this outlet can view and order.</small></div><strong>{selectedGroupIds.length} selected</strong></div>
                {groupsLoading ? <p className="outlets-product-access-loading">Loading production groups…</p> : <div className="outlets-product-groups">
                  {productGroups.map((group) => <label key={group.groupId} className={`outlets-product-group ${selectedGroupIds.includes(group.groupId) ? 'selected' : ''}`}><input type="checkbox" checked={selectedGroupIds.includes(group.groupId)} onChange={() => toggleProductGroup(group.groupId)} disabled={saving} /><span>{group.groupName}</span></label>)}
                </div>}
              </section>
              <Input label="Address (optional)" placeholder="Store address" value={form.address} onChange={update('address')} disabled={saving} />
              <Input label="Phone (optional)" placeholder="Store contact number" value={form.phone} onChange={update('phone')} disabled={saving} />
              <Button type="submit" variant="primary" className="outlets-submit" disabled={saving || groupsLoading || !selectedGroupIds.length}><Plus size={18} />{saving ? 'Creating outlet…' : 'Create outlet'}</Button>
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
                <Button variant="secondary" className="outlet-delete-button" onClick={() => openDeleteConfirmation(outlet)}><Trash2 size={16} />Delete outlet</Button>
              </article>)}
            </div>
          )}
        </CardContent>
      </Card>
      <Modal isOpen={Boolean(outletToDelete)} onClose={() => !deleting && setOutletToDelete(null)} title="Delete outlet and employees">
        <p className="outlet-delete-warning">This permanently deletes <strong>{outletToDelete?.outletName || outletToDelete?.outletId}</strong>, every employee login assigned to it, and all its HR/attendance records.</p>
        <p className="outlet-delete-preserved">Orders, load plans, dispatch, sales, and stock history are kept for audit.</p>
        <Input label={`Type ${outletToDelete?.outletId || 'the Outlet ID'} to confirm`} value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} disabled={deleting} />
        <div className="outlet-delete-actions"><Button variant="secondary" onClick={() => setOutletToDelete(null)} disabled={deleting}>Cancel</Button><Button variant="danger" onClick={handleDelete} disabled={deleting || deleteConfirmation.trim().toUpperCase() !== outletToDelete?.outletId?.toUpperCase()}>{deleting ? 'Deleting…' : 'Delete outlet and employees'}</Button></div>
      </Modal>
    </main>
  );
};

export default Outlets;
