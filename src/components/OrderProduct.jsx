import EmergencyTransferNote from './EmergencyTransferNote';
import {customProductName} from '../utils/saleProductName';
import ProductListBlocks from './ProductListBlocks';
import ProductHierarchyLabel from './ProductHierarchyLabel';
import React,{useContext} from 'react';
import ProductMrp from './ProductMrp';
import {MrpColumnContext} from '../context/ProductMrpContext';

export default function OrderProduct({ item, name, hideMrp=false, hideComplimentary=false }) {
  const hasMrpColumn=useContext(MrpColumnContext);
  const complimentary = !hideComplimentary && Array.isArray(item?.freeItems) ? item.freeItems : [];
  const offers = hideComplimentary || complimentary.length ? [] : (item?.complimentaryOffers || []);
  return <div className="order-product-description" style={{ whiteSpace: 'normal', minWidth: 0 }}>
    <ProductHierarchyLabel item={item}>{customProductName(name || item?.productName || item?.productId || item?.product_id || '—',item?.customSize)}</ProductHierarchyLabel>
    {Number(item?.divertedQty)>0&&<small style={{display:'block',color:'var(--color-primary)'}}>Emergency reassignment: {item.divertedQty} units removed from this original delivery; tracked by a separate factory replacement.</small>}
    <EmergencyTransferNote replacement={item?.emergencyReplacement} transfer={item?.emergencyTransfer}/>
    {!hideMrp && !hasMrpColumn && <ProductMrp item={item}/>}
    {item?.isFree && <small style={{ color: 'var(--color-primary)' }}>Complimentary</small>}
    {complimentary.length > 0 && <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
      <strong>Complimentary</strong>
      <ProductListBlocks items={complimentary} renderItem={(free, index) => <div key={`${free.product_id || free.productId}-${index}`}>{free.productName || free.product_id || free.productId} × {free.quantity}<ProductMrp item={free}/></div>}/>
    </div>}
    {<ProductListBlocks items={offers} renderItem={(offer, index) => <small key={offer.offerId || index} style={{ display: 'block', marginTop: '0.35rem', color: 'var(--color-primary)' }}>{offer.currentConfiguration ? 'Current complimentary offer' : 'Complimentary offer'}: {offer.freeProductName || offer.freeProductId} × {offer.freeQuantity}<ProductMrp item={{productId:offer.freeProductId}}/></small>}/>}
  </div>;
}
