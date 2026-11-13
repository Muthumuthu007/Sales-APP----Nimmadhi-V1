import React from 'react';
import {factorySchemeDetails} from '../utils/factoryComplimentary';
import {factoryProductName} from '../utils/saleProductName';
import OrderProduct from './OrderProduct';

export default function FactoryOrderProduct({order,item,compact=false}) {
 const schemes=factorySchemeDetails(order,item);
 const specifications=(order.salesSpecifications || []).filter(spec=>String(spec.productId || spec.product_id || '')===String(item.product_id || item.productId || ''));
 const colours=specifications.filter(spec=>String(spec.colour || '').trim());
 return <div>{item.isComplimentary && <strong style={{color:'var(--color-primary)'}}>Complimentary · </strong>}<OrderProduct item={compact?{...item,freeItems:[],complimentaryOffers:[]}:item} name={factoryProductName(order,item)}/>{!compact && <>{colours.map((spec,index)=><div key={`colour-${index}`} style={{marginTop:'.25rem',whiteSpace:'normal'}}><strong>Colour:</strong> {spec.colour}{specifications.length>1 && <> · Qty: {spec.quantity}{spec.size && <> · Size: {spec.size}</>}</>}</div>)}{!colours.length && !item.isComplimentary && <div><strong>Colour:</strong> {item.colour || 'Not specified'}</div>}{schemes.length>0 && <section style={{marginTop:'.5rem',padding:'.65rem',border:'1px solid var(--color-primary)',borderRadius:'.5rem',whiteSpace:'normal'}}><strong style={{color:'var(--color-primary)'}}>Complimentary items / sale scheme</strong>{schemes.map((entry,index)=><div key={index} style={{marginTop:'.35rem'}}>{entry.scheme}{schemes.length>1 && <small style={{display:'block'}}>For sale line quantity: {entry.quantity}</small>}</div>)}</section>}</>}</div>;
}
