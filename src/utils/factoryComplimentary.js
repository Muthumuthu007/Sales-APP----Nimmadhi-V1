// Explicit sale schemes belong only to their saved product ID.
export function factorySchemeDetails(order, item) {
 const pid=String(item.product_id || item.productId || '');
 return (order.salesSpecifications || []).filter(spec=>String(spec.productId || spec.product_id || '')===pid && String(spec.scheme || '').trim() && String(spec.scheme).trim()!=='0').map(spec=>({scheme:String(spec.scheme).trim(),quantity:Number(spec.quantity || 1)}));
}
