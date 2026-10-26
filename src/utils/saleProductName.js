export function saleProductName(name,size) {
 const match=String(size || '').match(/^\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*$/);
 if(!match)return name;
 return String(name || '').replace(/^\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?(?=\s|$)/,match.slice(1).join('X'));
}
export function factoryProductName(order,item) {
 const names=[...new Set((order.salesSpecifications || []).filter(spec=>(spec.productId || spec.product_id)===(item.product_id || item.productId)).map(spec=>saleProductName(item.productName,spec.size)))];
 return names.length?names.join(' / '):item.productName;
}
