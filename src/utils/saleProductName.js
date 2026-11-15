export function saleProductName(name,size) {
 const dimensions=String(size || '').trim().match(/^(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?:\s*[xX×]\s*(\d+(?:\.\d+)?))?$/);
 if(!dimensions)return name;
 const prefix=dimensions.slice(1).filter(value=>value!==undefined).join('X');
 return String(name || '').replace(/^\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?:\s*[xX×]\s*\d+(?:\.\d+)?)?(?=\s|$)/,prefix);
}
export function factoryProductName(order,item) {
 const names=[...new Set((order.salesSpecifications || []).filter(spec=>(spec.productId || spec.product_id)===(item.product_id || item.productId)).map(spec=>saleProductName(item.productName,spec.size)))];
 return names.length?names.join(' / '):item.productName;
}

// Older orders saved the base name plus a separate customSize object.
export function customProductName(name,size) {
 if(!size?.length || !size?.width)return name;
 const dimensions=[size.length,size.width,...(size.thickness?[size.thickness]:[])].map(Number).join('X');
 const prefix=dimensions+(size.unit==='cm'?' cm':'');
 const original=String(name || '').split(/\s*·\s*Customized:/)[0].trim();
 const pattern=/^\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?:\s*[xX×]\s*\d+(?:\.\d+)?)?(?:\s*(?:inches|inch|cm))?(?=\s|$)/;
 return pattern.test(original)?original.replace(pattern,prefix):`${prefix} ${original}`.trim();
}
