import ProductMrp from './ProductMrp';
import React from 'react';

export default function OrderFreeItems({item}) {
 const assigned=(item.freeItems || []).filter(free=>free.product_id || free.productId);
 const offers=(item.complimentaryOffers || []).filter(offer=>Number(offer.freeQuantity)>0);
 const quantity=Number(item.orderedQty ?? item.quantity ?? 0);
 return <section aria-label="Free items details" style={{minWidth:220,whiteSpace:'normal',overflowWrap:'anywhere',marginBottom:12}}>
  <strong style={{display:'block',marginBottom:8,color:'var(--color-primary)'}}>Free Items</strong>
  {assigned.length>0 ? assigned.map((free,index)=><div key={index} style={{padding:'8px 0',borderBottom:'1px solid var(--color-border)'}}><strong>{free.productName || free.product_id || free.productId}</strong><ProductMrp item={free}/><div>Assigned quantity: <b>{free.quantity}</b></div></div>) : offers.length>0 ? offers.map((offer,index)=><div key={offer.offerId || index} style={{padding:'8px 0',borderBottom:'1px solid var(--color-border)'}}>
    <strong>{offer.freeProductName || offer.freeProductId}</strong>
    <ProductMrp item={{productId:offer.freeProductId}}/><div>{Number(offer.freeQuantity)} free per ordered product</div>
    <div>For {quantity} ordered: <b>{quantity*Number(offer.freeQuantity)} free items</b></div>
    <small style={{color:'var(--color-text-muted)'}}>{offer.currentConfiguration?'Current offer — calculated quantity, not an approved allocation.':'Order offer — calculated quantity, not an approved allocation.'}</small>
   </div>) : <span style={{color:'var(--color-text-muted)'}}>No complimentary items assigned.</span>}
 </section>;
}
