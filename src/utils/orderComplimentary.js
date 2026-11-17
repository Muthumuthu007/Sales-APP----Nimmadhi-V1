export function complimentaryForProduct(offers, productId, groupId, product={}) {
  return offers.filter(offer => Number(offer.freeQuantity) > 0 && (
    offer.scope === 'OUTLET' ||
    (offer.scope === 'PRODUCT' && offer.productId === productId) ||
    (offer.scope === 'GROUP' && groupId && offer.groupId === groupId && (Array.isArray(offer.includedProductIds) && offer.includedProductIds.includes(productId)) && !(offer.excludedProductIds || []).includes(productId))
  )).map(offer=>resolveSizeComplimentary(offer,product));
}

export function resolveSizeComplimentary(offer,product={}) {
 if(!String(offer.freeProductId||'').startsWith('@SIZE:'))return offer;
 const source=offer.freeProductId;
 let length,width;
 const custom=product.customSize;
 if(custom){length=Number(custom.length);width=Number(custom.width);if(custom.unit==='cm'){length/=2.54;width/=2.54;}}
 else {const match=String(product.productName||product.product_name||product.label||'').match(/^\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?![\d.])/);if(match){length=Number(match[1]);width=Number(match[2]);}}
 const key=[length,width].every(v=>Number.isFinite(v)&&v>0)?[length,width].map(v=>String(Math.round(v*1e6)/1e6)).join('X'):null;
 const mapping=(offer.sizeMappings||[]).find(row=>row.size===key);
 return mapping?{...offer,sizeRuleProductId:source,sizeCategory:source.slice(6),mappedMattressSize:key,freeProductId:mapping.freeProductId,freeProductName:mapping.freeProductName}:{...offer,sizeRuleProductId:source,mappingError:`No ${source.slice(6).toLowerCase()} mapping configured for ${key||'this size'}. Ask admin to review.`,freeProductName:'Size mapping requires review'};
}

// A starting subgroup only: never choose a gift product or quantity for the user.
export function defaultComplimentaryGroup(products=[],accessories=[]) {
 if(!products.length || !products.every(product=>{
  if(product.isAccessory || String(product.mainGroupName||'').toLowerCase()==='accessories')return false;
  const size=product.customSize;
  let width;
  if(size){width=Number(size.width);if(size.unit==='cm')width/=2.54;}
  else {const match=String(product.productName||product.product_name||'').match(/^\s*\d+(?:\.\d+)?\s*[xX×]\s*(\d+(?:\.\d+)?)(?![\d.])/);width=match?Number(match[1]):NaN;}
  return [30,36].some(expected=>Math.abs(width-expected)<0.000001);
 }))return '';
 const pillow=accessories.find(product=>String(product.groupName||product.group_name||String(product.groupPath||'').split('→').at(-1)||'').trim().toUpperCase()==='PILLOWS');
 return pillow?.groupId || pillow?.group_id || '';
}
