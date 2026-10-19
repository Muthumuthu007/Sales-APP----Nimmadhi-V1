import CopyComplimentary from '../components/CopyComplimentary';
import {complimentaryProductGroups} from '../utils/complimentaryProductGroups';
import {complimentaryForProduct} from '../utils/orderComplimentary';
import GroupedProductPicker from '../components/GroupedProductPicker';
import {productionOption} from '../utils/productHierarchy';
import React, { useEffect, useMemo, useState } from 'react';
import { BadgeIndianRupee, Gift, Percent, Store, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateContainers';
import { fetchOutlets } from '../api/employees';
import { deleteOutletOffer, fetchOutletOffers, saveOutletOffer } from '../api/offers';
import './Offers.css';

const defaultOffer = (ruleType) => ({ ruleType, scope: ruleType === 'COMPLIMENTARY' ? 'GROUP' : 'OUTLET', groupId: '', productId: '', freeProductId: '', discountType: 'PERCENT', discountValue: '', freeQuantity: 1, active: true, assignmentMode: 'ADD', excludedProductIds: [] });

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
  const [productSearch,setProductSearch] = useState('');
  const [currentSearch,setCurrentSearch] = useState('');
  const [currentPage,setCurrentPage] = useState(1);

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

  useEffect(() => { setOffer(defaultOffer(ruleType));setCatalog(null);setProductSearch('');if (outletId) loadCatalog(outletId); }, [outletId, ruleType]);

  const products = useMemo(() => catalog?.products || [], [catalog]);
  const complimentaryProducts = useMemo(() => catalog?.complimentaryProducts || [], [catalog]);
  const update = (field, value) => setOffer((current) => ({ ...current, [field]: value }));
  const changeScope = (scope) => setOffer({ ...defaultOffer(ruleType), scope });
  const editOffer = item => {
    const members = products.filter(product=>product.groupId===item.groupId);
    const excludedIds = Array.isArray(item.includedProductIds) ? members.filter(product=>!item.includedProductIds.includes(product.productId)).map(product=>product.productId) : members.map(product=>product.productId);
    setOffer({...defaultOffer(ruleType),...item,assignmentMode:'ADD',excludedProductIds:excludedIds});setProductSearch('');
  };
  const changeGroup = groupId => {

    setOffer({...defaultOffer(ruleType),scope:'GROUP',groupId,excludedProductIds:[]});setProductSearch('');
  };
  const groupProducts = products.filter(item => item.groupId === offer.groupId);
  const listedProducts = groupProducts.filter(item => item.productName?.toLowerCase().includes(productSearch.trim().toLowerCase()));
  const excluded = offer.excludedProductIds || [];
  const includedCount = groupProducts.filter(item=>!excluded.includes(item.productId)).length;
  const toggleProduct = id => update('excludedProductIds',excluded.includes(id) ? excluded.filter(value=>value!==id) : [...excluded,id]);
  const assignmentFor = product => complimentaryForProduct(catalog?.offers || [],product.productId,product.groupId);
  const reassignedProducts = groupProducts.filter(product=>!excluded.includes(product.productId) && assignmentFor(product).some(rule=>rule.offerId!==offer.offerId));


  const currentGroups = useMemo(()=>complimentaryProductGroups(products,catalog?.offers || []),[products,catalog]);
  const matchingProducts = currentGroups.products.filter(product=>`${product.productName || product.productId} ${product.groupName || ''}`.toLowerCase().includes(currentSearch.trim().toLowerCase()));
  const currentPages = Math.max(1,Math.ceil(matchingProducts.length/20));
  const visibleCurrentProducts = matchingProducts.slice((Math.min(currentPage,currentPages)-1)*20,Math.min(currentPage,currentPages)*20);
  const addForProduct = product => {setOffer({...defaultOffer(ruleType),scope:'PRODUCT',productId:product.productId});setProductSearch('');};

  const targetLabel = (item) => item.scope === 'OUTLET' ? 'Entire outlet' : item.scope === 'GROUP' ? `Group: ${item.groupName || item.groupId}` : item.productName || `Product: ${item.productId}`;

  const submit = async (event) => {
    event.preventDefault();
    if (!outletId) return;
    if (offer.scope === 'GROUP' && !offer.groupId) { setError('Choose a product group.'); return; }
    if (offer.scope === 'PRODUCT' && !offer.productId) { setError('Choose a product.'); return; }
    if (isComplimentary && offer.scope === 'GROUP' && !includedCount) {setError('Check at least one product for this offer.');return;}
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
        ...(isComplimentary ? {assignmentMode: offer.assignmentMode || 'ADD'} : {}),
        scope: offer.scope,
        active: offer.active,
        discountType: offer.discountType,
        discountValue: isComplimentary ? 0 : Number(offer.discountValue || 0),
        freeQuantity: isComplimentary ? Number(offer.freeQuantity || 0) : 0,
      };
      if (offer.scope === 'GROUP') {payload.groupId=offer.groupId;if(isComplimentary){payload.includedProductIds=groupProducts.filter(product=>!excluded.includes(product.productId)).map(product=>product.productId);if(offer.offerId)payload.offerId=offer.offerId;}}
      if (offer.scope === 'PRODUCT') {payload.productId=offer.productId;if(isComplimentary && offer.offerId)payload.offerId=offer.offerId;}
      if (isComplimentary) payload.freeProductId = offer.freeProductId;
      await saveOutletOffer(payload);
      setOffer(defaultOffer(ruleType)); await loadCatalog(); setSuccess(`${isComplimentary ? 'Complimentary product' : 'Discount'} saved.`);
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
    {isComplimentary && <CopyComplimentary outlets={outlets} onCopied={()=>loadCatalog()}/> }
    <div className="offers-layout">
      <Card className="offers-form-card"><CardHeader title={isComplimentary && offer.offerId ? 'Reassign complimentary products' : 'Create an offer'} /><CardContent>
        {loading && !catalog ? <LoadingState /> : !outlets.length ? <EmptyState title="Create an outlet before configuring offers." /> : <form className="offers-form" onSubmit={submit}>
          <label>Outlet<select value={outletId} onChange={(event) => setOutletId(event.target.value)}>{outlets.map((outlet) => <option key={outlet.outletId} value={outlet.outletId}>{outlet.outletName || outlet.outletId} — {outlet.outletId}</option>)}</select></label>
          <fieldset><legend>{isComplimentary ? 'Qualifying purchase' : 'Apply discount to'}</legend><div className="offers-scope-grid">{(isComplimentary ? [['GROUP', 'One product group'], ['PRODUCT', 'One product']] : [['OUTLET', 'Entire outlet'], ['GROUP', 'One product group'], ['PRODUCT', 'One product']]).map(([scope, label]) => <button type="button" key={scope} className={offer.scope === scope ? 'selected' : ''} onClick={() => changeScope(scope)}>{scope === 'OUTLET' ? <Store size={18} /> : scope === 'GROUP' ? <Percent size={18} /> : <Gift size={18} />}<span>{label}</span></button>)}</div></fieldset>
          {offer.scope === 'GROUP' && <label>Product group<select value={offer.groupId} onChange={(event) => changeGroup(event.target.value)}><option value="">Select group</option>{(catalog?.groups || []).map((group) => <option key={group.groupId} value={group.groupId}>{group.groupPath || group.groupName}</option>)}</select></label>}
          {isComplimentary && offer.scope === 'GROUP' && offer.groupId && <fieldset className="offer-eligible-products" disabled={saving || loading}>
            <legend>Products receiving this complimentary offer</legend>
            <p className="offers-help">All products are checked by default for a new offer. Uncheck products you do not want. Existing complimentary items are kept unless you choose to replace them.</p>
            <div className="offer-eligible-summary"><strong>{includedCount} of {groupProducts.length} products included</strong><Button type="button" variant="secondary" onClick={()=>update('excludedProductIds',[])} disabled={saving || loading || !excluded.length}>Check all products</Button></div>
            <Input label="Find a product in this group" type="search" value={productSearch} onChange={event=>setProductSearch(event.target.value)} placeholder="Search by product name or size" />
            <div className="offer-product-checklist">{listedProducts.map(item=><label className="offer-product-option" key={item.productId}><input type="checkbox" checked={!excluded.includes(item.productId)} onChange={()=>toggleProduct(item.productId)} /><span>{item.productName}{assignmentFor(item).length>0 && <small className="offer-current-assignment">Current: {assignmentFor(item).map(rule=>`${rule.freeProductName || 'Complimentary item'} × ${rule.freeQuantity}`).join(', ')}</small>}</span></label>)}{!listedProducts.length && <p className="offers-help">{groupProducts.length ? 'No products match your search.' : 'This group has no products.'}</p>}</div>
          </fieldset>}
          {isComplimentary && offer.assignmentMode === 'REPLACE' && offer.scope === 'GROUP' && reassignedProducts.length>0 && <p className="offers-help">Saving will reassign {reassignedProducts.length} selected {reassignedProducts.length===1?'product':'products'} from the previous complimentary offer. Other products will keep their existing offers.</p>}
          {offer.scope === 'PRODUCT' && <GroupedProductPicker label="Qualifying product" options={products.map(productionOption)} value={offer.productId} onChange={value=>update('productId',value)} />}
          {isComplimentary && <label>Existing complimentary items<select value={offer.assignmentMode || 'ADD'} onChange={event=>update('assignmentMode',event.target.value)}><option value="ADD">Update this item's quantity; keep different items</option><option value="REPLACE">Replace other group/product offers for selected products</option></select></label>}
          {isComplimentary ? <><GroupedProductPicker label="Complimentary accessory" options={complimentaryProducts.map(productionOption)} value={offer.freeProductId} onChange={value=>update('freeProductId',value)} /><Input label="Complimentary quantity" type="number" min="1" step="1" value={offer.freeQuantity} onChange={(event) => update('freeQuantity', event.target.value)} /><p className="offers-help">All products under Accessories and its subgroups can be selected as complimentary products. The qualifying group or product remains limited to the selected outlet’s assigned products.</p></> : <div className="offers-value-grid"><label>Discount type<select value={offer.discountType} onChange={(event) => update('discountType', event.target.value)}><option value="PERCENT">Percentage (%)</option><option value="AMOUNT">Fixed amount (₹)</option></select></label><Input label="Discount value" type="number" min="0.01" max={offer.discountType === 'PERCENT' ? '100' : undefined} step="0.01" value={offer.discountValue} onChange={(event) => update('discountValue', event.target.value)} placeholder="0.00" /></div>}
          <Button type="submit" variant="primary" disabled={saving || loading || (isComplimentary && offer.scope==='GROUP' && !includedCount)}>{saving ? 'Saving…' : isComplimentary ? 'Save complimentary product' : 'Save discount'}</Button>
        </form>}
      </CardContent></Card>
      {isComplimentary ? <Card className="offers-current-products"><CardHeader title={`Complimentary items by product${catalog?.outlet?.outletName ? ` — ${catalog.outlet.outletName}` : ''}`} /><CardContent>
        {loading ? <LoadingState /> : <>
          <Input label="Find an assigned product" type="search" placeholder="Search product name or size" value={currentSearch} onChange={event=>{setCurrentSearch(event.target.value);setCurrentPage(1);}} />
          <p className="offers-help">{matchingProducts.length} {matchingProducts.length===1?'product':'products'} with complimentary items. Each product is shown once with all its assigned items.</p>
          <div className="offers-list">{visibleCurrentProducts.map(product=><article className="offer-rule" key={product.productId}>
            <div className="offer-rule-content"><strong>{product.productName || product.productId}</strong><p>{product.groupPath || product.groupName || 'Product'}</p></div>
            <div className="offer-product-benefits">{product.offers.map(item=><div className="offer-product-benefit" key={item.offerId}>
              <div><Gift size={16}/><span>{item.freeProductName || item.freeProductId} <b>× {item.freeQuantity}</b></span></div>
              <div className="offer-rule-actions"><Button variant="secondary" disabled={saving} onClick={()=>editOffer(item)}>Edit item</Button><Button variant="secondary" className="offer-remove" disabled={saving} onClick={()=>remove(item.offerId)}><Trash2 size={15}/>Remove offer</Button></div>
              {item.scope === 'GROUP' && <small>Shared group offer. Editing or removing it applies to every assigned product.</small>}
            </div>)}</div>
            <Button variant="secondary" disabled={saving} onClick={()=>addForProduct(product)}>Add complimentary item</Button>
          </article>)}</div>
          {!matchingProducts.length && <EmptyState title="No assigned products match this view." />}
          {currentPages>1 && <div className="offer-rule-actions"><Button variant="secondary" disabled={currentPage<=1} onClick={()=>setCurrentPage(page=>page-1)}>Previous</Button><span>Page {Math.min(currentPage,currentPages)} of {currentPages}</span><Button variant="secondary" disabled={currentPage>=currentPages} onClick={()=>setCurrentPage(page=>page+1)}>Next</Button></div>}
          {currentGroups.unassigned.length>0 && <details className="offer-unassigned"><summary>Unassigned offers ({currentGroups.unassigned.length})</summary><p className="offers-help">These saved offers currently have no matching products. Edit the offer to assign products; they are not included in any product’s benefits above.</p>{currentGroups.unassigned.map(item=><article className="offer-rule" key={item.offerId}><div className="offer-rule-content"><strong>{targetLabel(item)}</strong><p>{item.freeProductName || item.freeProductId} × {item.freeQuantity}</p></div><div className="offer-rule-actions"><Button variant="secondary" onClick={()=>editOffer(item)}>Edit / reassign</Button><Button variant="secondary" onClick={()=>remove(item.offerId)}>Remove offer</Button></div></article>)}</details>}
        </>}
      </CardContent></Card> : <Card><CardHeader title={`Current offers${catalog?.outlet?.outletName ? ` — ${catalog.outlet.outletName}` : ''}`} /><CardContent>{loading ? <LoadingState /> : !(catalog?.offers || []).length ? <EmptyState title="No offers configured for this outlet." /> : <div className="offers-list">{catalog.offers.map((item) => <article key={item.offerId} className="offer-rule"><div className="offer-rule-content"><strong>{targetLabel(item)}</strong><p>{Number(item.discountValue || 0) > 0 && <><BadgeIndianRupee size={15} /> {item.discountType === 'PERCENT' ? `${item.discountValue}% discount` : `₹${item.discountValue} discount`}</>}{Number(item.freeQuantity || 0) > 0 && <><Gift size={15} /><span className="offer-rule-benefit"><span>Complimentary</span><span>{item.freeProductName || item.freeProductId} <b>× {item.freeQuantity}</b></span></span></>}</p>{isComplimentary && item.scope === 'GROUP' && <p>{Array.isArray(item.includedProductIds) ? `${item.includedProductIds.length} products assigned` : item.excludedProductIds?.length ? `${item.excludedProductIds.length} ${item.excludedProductIds.length === 1 ? 'product' : 'products'} excluded` : 'All products included'}</p>}</div><div className="offer-rule-actions">{isComplimentary && item.scope === 'GROUP' && <Button variant="secondary" disabled={loading || saving} onClick={()=>changeGroup(item.groupId)}>Add another offer</Button>}<Button variant="secondary" disabled={loading || saving} onClick={()=>editOffer(item)}>{isComplimentary?'Edit / reassign':'Edit'}</Button><Button variant="secondary" className="offer-remove" onClick={() => remove(item.offerId)}><Trash2 size={16} />Remove</Button></div></article>)}</div>}</CardContent></Card>}

    </div>
  </main>;
};

export default Offers;
