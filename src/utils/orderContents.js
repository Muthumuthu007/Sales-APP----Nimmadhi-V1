import {customProductName} from './saleProductName.js';
// Presentation only: retain product IDs, absolute gift quantities and original rows.
export const isComplimentaryItem=item=>Boolean(item?.isFree || item?.isComplimentary);
const id=item=>item?.catalogueProductId || item?.product_id || item?.productId || item?.freeProductId;
export const itemQuantity=item=>{
 const value=item?.orderedQty ?? item?.quantity ?? item?.qty;
 if(value===null || value===undefined || value==='')return null;
 const number=Number(value);return Number.isFinite(number)&&number>=0?number:null;
};
export function orderContents(items=[]){
 const products=items.filter(item=>!isComplimentaryItem(item));
 const flat=items.filter(isComplimentaryItem),gifts=[];
 const parents=new Map();
 for(const product of products){
  for(const gift of product.freeItems || []){
   const pid=id(gift);if(!pid){if(gift.productName)gifts.push({...gift,isFree:true,complimentaryFor:[{productId:id(product),productName:customProductName(product.productName || id(product),product.customSize)}]});continue;}
   if(!parents.has(pid))parents.set(pid,[]);
   parents.get(pid).push({productId:id(product),productName:customProductName(product.productName || product.product_name || id(product),product.customSize)});
   if(!flat.some(row=>id(row)===pid))gifts.push({...gift,isFree:true,complimentaryFor:[{productId:id(product),productName:customProductName(product.productName || product.product_name || id(product),product.customSize)}]});
  }
 }
 for(const gift of flat){
  const related=gift.complimentaryFor?.length?gift.complimentaryFor:parents.get(id(gift)) || (gift.parentProductId?[{productId:gift.parentProductId,productName:gift.parentProductName || products.find(row=>id(row)===gift.parentProductId)?.productName || gift.parentProductId}]:[]);
  gifts.push({...gift,complimentaryFor:related});
 }
 // Offers are estimates, not approved stock obligations. Keep their total separate.
 if(!flat.length)for(const product of products){
  if(product.freeItems?.length)continue;
  for(const offer of product.complimentaryOffers || []){
   if(offer.currentConfiguration || !Number.isFinite(Number(offer.freeQuantity)) || !(Number(offer.freeQuantity)>0))continue;
   const count=itemQuantity(product);
   gifts.push({productId:offer.freeProductId,productName:offer.freeProductName || offer.freeProductId,quantity:count===null?null:Number(offer.freeQuantity)*count,isFree:true,isOfferEstimate:true,complimentaryFor:[{productId:id(product),productName:customProductName(product.productName || id(product),product.customSize)}]});
  }
 }
 return {products,complimentary:gifts,unknownQuantities:gifts.filter(row=>itemQuantity(row)===null).length,productTotal:products.reduce((n,row)=>n+(itemQuantity(row) || 0),0),complimentaryTotal:gifts.filter(row=>!row.isOfferEstimate).reduce((n,row)=>n+(itemQuantity(row)||0),0),offerTotal:gifts.filter(row=>row.isOfferEstimate).reduce((n,row)=>n+(itemQuantity(row)||0),0)};
}
