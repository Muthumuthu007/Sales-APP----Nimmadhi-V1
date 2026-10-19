import {complimentaryForProduct} from './orderComplimentary.js';

/** Resolve membership first; unrelated offers in the same group must not mix. */
export function complimentaryProductGroups(products, offers) {
 const active=offers.filter(rule=>rule.active!==false&&Number(rule.freeQuantity)>0);
 const used=new Set();const seen=new Set();const grouped=[];
 for(const product of products){
  if(seen.has(product.productId))continue;
  seen.add(product.productId);
  const rules=complimentaryForProduct(active,product.productId,product.groupId);
  if(!rules.length)continue;
  for(const rule of rules)used.add(rule.offerId);
  grouped.push({...product,offers:rules});
 }
 grouped.sort((a,b)=>(a.productName||a.productId).localeCompare(b.productName||b.productId));
 return {products:grouped,unassigned:offers.filter(rule=>!used.has(rule.offerId))};
}
