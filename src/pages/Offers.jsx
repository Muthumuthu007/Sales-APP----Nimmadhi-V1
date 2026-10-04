import React, { useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, Gift, Percent, Store, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateContainers';
import { fetchOutlets } from '../api/employees';
import { deleteOutletOffer, fetchOutletOffers, saveOutletOffer } from '../api/offers';
import './Offers.css';

const defaultOffer = (ruleType) => ({ ruleType, scope: ruleType === 'COMPLIMENTARY' ? 'GROUP' : 'OUTLET', groupId: '', productId: '', freeProductId: '', discountType: 'PERCENT', discountValue: '', freeQuantity: 1, active: true });

const Offers = ({ ruleType = 'DISCOUNT' }) => {
  const isComplimentary = ruleType === 'COMPLIMENTARY';
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [catalog, setCatalog] = useState(null);
  const [offer, setOffer] = useState(() => defaultOffer(ruleType));
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

  useEffect(() => { setOffer(defaultOffer(ruleType)); }, [ruleType]);

  const loadCatalog = async (id = outletId) => {
    if (!id) return;
    setLoading(true); setError(''); setSuccess('');
    try { setCatalog(await fetchOutletOffers(id, ruleType)); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Unable to load the outlet product access.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (outletId) loadCatalog(outletId); }, [outletId, ruleType]);

  const products = useMemo(() => catalog?.products || [], [catalog]);
  const complimentaryProducts = useMemo(() => catalog?.complimentaryProducts || [], [catalog]);
  const update = (field, value) => setOffer((current) => ({ ...current, [field]: value }));
  const changeScope = (scope) => setOffer({ ...defaultOffer(ruleType), scope });
  const targetLabel = (item) => item.scope === 'OUTLET' ? 'Entire outlet' : item.scope === 'GROUP' ? `Group: ${item.groupName || item.groupId}` : item.productName || `Product: ${item.productId}`;

  const submit = async (event) => {
    event.preventDefault();
    if (!outletId) return;
    if (offer.scope === 'GROUP' && !offer.groupId) { setError('Choose a product group.'); return; }
    if (offer.scope === 'PRODUCT' && !offer.productId) { setError('Choose a product.'); return; }
    if (isComplimentary && !offer.freeProductId) { setError('Choose the complimentary product.'); return; }
    if (!isComplimentary && !(Number(offer.discountValue || 0) > 0)) { setError('Set a discount value.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      // Do not send blank identifiers. Django REST Framework correctly treats
      // an explicitly supplied blank ID as invalid, even when that field is
      // irrelevant to the selected offer scope.
      const payload = {
        outletId,
        ruleType,
        scope: offer.scope,
        active: offer.active,
        discountType: offer.discountType,
        discountValue: isComplimentary ? 0 : Number(offer.discountValue || 0),
        freeQuantity: isComplimentary ? Number(offer.freeQuantity || 0) : 0,
      };
      if (offer.scope === 'GROUP') payload.groupId = offer.groupId;
      if (offer.scope === 'PRODUCT') payload.productId = offer.productId;
      if (isComplimentary) payload.freeProductId = offer.freeProductId;
      await saveOutletOffer(payload);
      setOffer(defaultOffer(ruleType)); setSuccess(`${isComplimentary ? 'Complimentary product' : 'Discount'} saved.`); await loadCatalog();
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
    <section className="offers-intro"><div className="offers-intro-icon">{isComplimentary ? <Gift size={22} /> : <BadgeIndianRupee size={22} />}</div><div><p>Sales administration</p><h2>{isComplimentary ? 'Complimentary products' : 'Discounts'}</h2><span>{isComplimentary ? 'Choose the qualifying group or product, then select the product to give free.' : 'Set a discount for an outlet, group, or product.'}</span></div></section>
    {error && <div className="offers-alert offers-alert-error">{error}</div>}
    {success && <div className="offers-alert offers-alert-success">{success}</div>}
    <div className="offers-layout">
      <Card className="offers-form-card"><CardHeader title="Create or update an offer" /><CardContent>
        {loading && !catalog ? <LoadingState /> : !outlets.length ? <EmptyState title="Create an outlet before configuring offers." /> : <form className="offers-form" onSubmit={submit}>
          <label>Outlet<select value={outletId} onChange={(event) => setOutletId(event.target.value)}>{outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.outletName || outlet.outletId} — {outlet.outletId}</option>)}</select></label>
          <fieldset><legend>{isComplimentary ? 'Qualifying purchase' : 'Apply discount to'}</legend><div className="offers-scope-grid">{(isComplimentary ? [['GROUP', 'One product group'], ['PRODUCT', 'One product']] : [['OUTLET', 'Entire outlet'], ['GROUP', 'One product group'], ['PRODUCT', 'One product']]).map(([scope, label]) => <button type="button" key={scope} className={offer.scope === scope ? 'selected' : ''} onClick={() => changeScope(scope)}>{scope === 'OUTLET' ? <Store size={18} /> : scope === 'GROUP' ? <Percent size={18} /> : <Gift size={18} />}<span>{label}</span></button>)}</div></fieldset>
          {offer.scope === 'GROUP' && <label>Product group<select value={offer.groupId} onChange={(event) => update('groupId', event.target.value)}><option value="">Select group</option>{(catalog?.groups || []).map((group) => <option key={group.groupId} value={group.groupId}>{group.groupName}</option>)}</select></label>}
          {offer.scope === 'PRODUCT' && <label>Product<select value={offer.productId} onChange={(event) => update('productId', event.target.value)}><option value="">Select product</option>{products.map((product) => <option key={product.productId} value={product.productId}>{product.productName}</option>)}</select></label>}
          {isComplimentary ? <><label>Complimentary product<select value={offer.freeProductId} onChange={(event) => update('freeProductId', event.target.value)}><option value="">Select Pillow product to give free</option>{complimentaryProducts.map((product) => <option key={product.productId} value={product.productId}>{product.productName}</option>)}</select></label><Input label="Complimentary quantity" type="number" min="1" step="1" value={offer.freeQuantity} onChange={(event) => update('freeQuantity', event.target.value)} /><p className="offers-help">Only products from the Pillows group can be selected as a complimentary product. The qualifying group or product remains limited to the selected outlet’s assigned products.</p></> : <div className="offers-value-grid"><label>Discount type<select value={offer.discountType} onChange={(event) => update('discountType', event.target.value)}><option value="PERCENT">Percentage (%)</option><option value="AMOUNT">Fixed amount (₹)</option></select></label><Input label="Discount value" type="number" min="0.01" max={offer.discountType === 'PERCENT' ? '100' : undefined} step="0.01" value={offer.discountValue} onChange={(event) => update('discountValue', event.target.value)} placeholder="0.00" /></div>}
          <Button type="submit" variant="primary" disabled={saving || loading}>{saving ? 'Saving…' : isComplimentary ? 'Save complimentary product' : 'Save discount'}</Button>
        </form>}
      </CardContent></Card>
      <Card><CardHeader title={`Current offers${catalog?.outlet?.outletName ? ` — ${catalog.outlet.outletName}` : ''}`} /><CardContent>{loading ? <LoadingState /> : !(catalog?.offers || []).length ? <EmptyState title="No offers configured for this outlet." /> : <div className="offers-list">{catalog.offers.map((item) => <article key={item.offerId} className="offer-rule"><div><strong>{targetLabel(item)}</strong><p>{Number(item.discountValue || 0) > 0 && <><BadgeIndianRupee size={15} /> {item.discountType === 'PERCENT' ? `${item.discountValue}% discount` : `₹${item.discountValue} discount`}</>}{Number(item.freeQuantity || 0) > 0 && <><Gift size={15} /> Main: {item.qualifyingLabel || targetLabel(item)} → Complimentary: {item.freeProductName || item.freeProductId} × {item.freeQuantity}</>}</p></div><Button variant="secondary" className="offer-remove" onClick={() => remove(item.offerId)}><Trash2 size={16} />Remove</Button></article>)}</div>}</CardContent></Card>
    </div>
  </main>;
};

export default Offers;
