export function productId(item) {return item?.product_id || item?.productId || item?.value || item?.id;}
export function mappedMrp(item, catalogue={}) {
 const value=catalogue[productId(item)] ?? item?.mrpSticker;
 if(value===null || value===undefined || value==='' || !Number.isFinite(Number(value)) || Number(value)<=0)return null;
 return Number(value);
}
export function mrpText(value) {return value===null?'Not mapped':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);}
