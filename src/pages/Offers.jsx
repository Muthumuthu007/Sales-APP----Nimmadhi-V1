import React, { useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, Gift, Percent, Store, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateContainers';
import { fetchOutlets } from '../api/employees';
import { deleteOutletOffer, fetchOutletOffers, saveOutletOffer } from '../api/offers';
import './Offers.css';

const defaultOffer = { scope: 'OUTLET', groupId: '', productId: '', discountType: 'PERCENT', discountValue: '', freeQuantity: 0, active: true };

const Offers = () => {
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [catalog, setCatalog] = useState(null);
  const [offer, setOffer] = useState(defaultOffer);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOutlets().then((data) => {
      const available = data?.outlets || [];
      setOutlets(available);
      if (available.length) setOutletId(available[0].outletId);
    }).catch(() => setError('Unable to load outlets.')).finally(() => setLoading(false));
  }, []);

  const loadCatalog = async (id = outletId) => {
    if (!id) return;
    setLoading(true); setError(''); setSuccess('');
    try { setCatalog(await fetchOutletOffers(id)); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Unable to load the outlet product access.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (outletId) loadCatalog(outletId); }, [outletId]);

  const products = useMemo(() => catalog?.products || [], [catalog]);
  const update = (field, value) => setOffer((current) => ({ ...current, [field]: value }));
  const changeScope = (scope) => setOffer({ ...defaultOffer, scope });
  const targetLabel = (item) => item.scope === 'OUTLET' ? 'Entire outlet' : item.scope === 'GROUP' ? `Group: ${item.groupId}` : item.productName || `Product: ${item.productId}`;

  const submit = async (event) => {
    event.preventDefault();
    if (!outletId) return;
    if (offer.scope === 'GROUP' && !offer.groupId) { setError('Choose a product group.'); return; }
    if (offer.scope === 'PRODUCT' && !offer.productId) { setError('Choose a product.'); return; }
    if (!(Number(offer.discountValue || 0) > 0) && !(Number(offer.freeQuantity) > 0)) { setError('Set a discount or a complimentary quantity.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await saveOutletOffer({ ...offer, outletId, discountValue: Number(offer.discountValue || 0), freeQuantity: Number(offer.freeQuantity || 0) });
      setOffer(defaultOffer); setSuccess('Offer saved. It is now available to this outlet sales team.'); await loadCatalog();
    } catch (requestError) { setError(requestError.response?.data?.error || requestError.response?.data?.non_field_errors?.[0] || 'Unable to save this offer.'); }
    finally { setSaving(false); }
  };

  const remove = async (offerId) => {
    if (!window.confirm('Remove this offer? Existing invoices will not be changed.')) return;
    setError(''); setSuccess('');
    try { await deleteOutletOffer(outletId, offerId); setSuccess('Offer removed.'); await loadCatalog(); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Unable to remove this offer.'); }
  };

  return <main className="offers-page">
    <section className="offers-intro"><div className="offers-intro-icon"><Gift size={22} /></div><div><p>Sales administration</p><h2>Outlet offers & discounts</h2><span>Set a promotion for one outlet, an assigned product group, or a specific product.</span></div></section>
    {error && <div className="offers-alert offers-alert-error">{error}</div>}
    {success && <div className="offers-alert offers-alert-success">{success}</div>}
    <div className="offers-layout">
      <Card className="offers-form-card"><CardHeader title="Create or update an offer" /><CardContent>
        {loading && !catalog ? <LoadingState /> : !outlets.length ? <EmptyState title="Create an outlet before configuring offers." /> : <form className="offers-form" onSubmit={submit}>
          <label>Outlet<select value={outletId} onChange={(event) => setOutletId(event.target.value)}>{outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.outletName || outlet.outletId} — {outlet.outletId}</option>)}</select></label>
          <fieldset><legend>Apply this offer to</legend><div className="offers-scope-grid">{[['OUTLET', 'Entire outlet'], ['GROUP', 'One product group'], ['PRODUCT', 'One product']].map(([scope, label]) => <button type="button" key={scope} className={offer.scope === scope ? 'selected' : ''} onClick={() => changeScope(scope)}>{scope === 'OUTLET' ? <Store size={18} /> : scope === 'GROUP' ? <Percent size={18} /> : <Gift size={18} />}<span>{label}</span></button>)}</div></fieldset>
          {offer.scope === 'GROUP' && <label>Product group<select value={offer.groupId} onChange={(event) => update('groupId', event.target.value)}><option value="">Select group</option>{(catalog?.groups || []).map((group) => <option key={group.groupId} value={group.groupId}>{group.groupName}</option>)}</select></label>}
          {offer.scope === 'PRODUCT' && <label>Product<select value={offer.productId} onChange={(event) => update('productId', event.target.value)}><option value="">Select product</option>{products.map((product) => <option key={product.productId} value={product.productId}>{product.productName}</option>)}</select></label>}
          <div className="offers-value-grid"><label>Discount type<select value={offer.discountType} onChange={(event) => update('discountType', event.target.value)}><option value="PERCENT">Percentage (%)</option><option value="AMOUNT">Fixed amount (₹)</option></select></label><Input label="Discount value" type="number" min="0" max={offer.discountType === 'PERCENT' ? '100' : undefined} step="0.01" value={offer.discountValue} onChange={(event) => update('discountValue', event.target.value)} placeholder="0.00" /></div>
          <Input label="Complimentary quantity" type="number" min="0" step="1" value={offer.freeQuantity} onChange={(event) => update('freeQuantity', event.target.value)} />
          <p className="offers-help">Complimentary quantity is recorded with sales as the offer available for the selected outlet, group, or product. The sales team still confirms the final bill amount, so no price is silently changed.</p>
          <Button type="submit" variant="primary" disabled={saving || loading}>{saving ? 'Saving offer…' : 'Save offer'}</Button>
        </form>}
      </CardContent></Card>
      <Card><CardHeader title={`Current offers${catalog?.outlet?.outletName ? ` — ${catalog.outlet.outletName}` : ''}`} /><CardContent>{loading ? <LoadingState /> : !(catalog?.offers || []).length ? <EmptyState title="No offers configured for this outlet." /> : <div className="offers-list">{catalog.offers.map((item) => <article key={item.offerId} className="offer-rule"><div><strong>{targetLabel(item)}</strong><p>{Number(item.discountValue || 0) > 0 && <><BadgeIndianRupee size={15} /> {item.discountType === 'PERCENT' ? `${item.discountValue}% discount` : `₹${item.discountValue} discount`}</>}{Number(item.freeQuantity || 0) > 0 && <><Gift size={15} /> {item.freeQuantity} complimentary</>}</p></div><Button variant="secondary" className="offer-remove" onClick={() => remove(item.offerId)}><Trash2 size={16} />Remove</Button></article>)}</div>}</CardContent></Card>
    </div>
  </main>;
};

export default Offers;
