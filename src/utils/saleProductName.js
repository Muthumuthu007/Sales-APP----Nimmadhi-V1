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
