// Drafts are scoped to the signed-in account and outlet on this device.
export function salesDraftKey(owner, outlet) {
  return `sales-draft:v1:${encodeURIComponent(owner || '')}:${encodeURIComponent(outlet || '')}`;
}
export function readSalesDraft(store, key) {
  try { const data=JSON.parse(store.getItem(key)); return data?.version===1 && data.form && Array.isArray(data.form.salesItems) ? data : null; }
  catch { return null; }
}
export function writeSalesDraft(store,key,form,pending=null) {
  try { store.setItem(key,JSON.stringify({version:1,updatedAt:new Date().toISOString(),form,pending})); return true; }
  catch { return false; }
}
const labels={soldItems:'Product',qty:'Quantity',mrpSticker:'Sticker MRP',discountPercent:'Discount',taxPercent:'Tax',fulfillmentMode:'Delivery source',customerName:'Customer name',customerPhone:'Customer phone',customerAddress:'Customer address',dispatchDate:'Dispatch date',advanceAmount:'Amount received',billAmount:'Bill amount',payments:'Split payment',non_field_errors:''};
export function saleErrorDetails(data,path='') {
  if (typeof data==='string') return [path?`${path}: ${data}`:data];
  if (Array.isArray(data)) return data.flatMap((item,index)=>saleErrorDetails(item,typeof item==='object' && item!==null?`${path} ${index+1}`:path));
  if (data && typeof data==='object') return Object.entries(data).flatMap(([key,value])=>saleErrorDetails(value,[path,labels[key] ?? (['error','message','detail'].includes(key)?'':key)].filter(Boolean).join(' · ')));
  return [];
}
export function uncertainSale(error) {
  return !error.response || error.response.status>=500 || [408,429].includes(error.response.status);
}

export function saleSubmissionIssues(form, owned) {
  const issues=[];
  if(!owned)return issues;
  const limits={customerName:150,customerPhone:30,customerAddress:500,extraDiscountReason:300};
  for(const [key,max] of Object.entries(limits))if(String(form[key] || '').trim().length>max)issues.push(`${labels[key] || key}: use at most ${max} characters.`);
  if(String(form.advanceAmount ?? '').trim()==='')issues.push('Enter the amount received, or enter 0 if no payment was received.');
  for(const [index,item] of (form.salesItems || []).entries()){
    if(!Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity)<1)issues.push(`Product ${index+1}: quantity must be a whole number greater than zero.`);
    for(const [key,max] of Object.entries({brand:80,model:200,colour:80,size:80,scheme:500}))if(String(item[key] || '').trim().length>max)issues.push(`Product ${index+1} · ${key}: use at most ${max} characters.`);
  }
  return issues;
}
