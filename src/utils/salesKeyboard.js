export function visibleSalesControls(root) {
  return [...root.querySelectorAll('input, select, textarea, button, summary')].filter(node=>
    !node.disabled && !node.readOnly && node.tabIndex!==-1 && node.getClientRects().length>0 && !node.closest('[hidden],[data-sales-keyboard-skip],details:not([open]) > :not(summary)') && node.getAttribute('type')!=='hidden');
}
export function salesEnterKey(event) {
  if(event.defaultPrevented || event.nativeEvent?.isComposing || event.key!=='Enter' || event.altKey || event.ctrlKey || event.metaKey)return;
  const target=event.target;
  // Buttons, text areas and searchable lists retain their own Enter behavior.
  if(!['INPUT','SELECT'].includes(target.tagName) || target.closest('[data-searchable-select]'))return;
  event.preventDefault();
  const controls=visibleSalesControls(event.currentTarget),index=controls.indexOf(target);
  const next=controls[index+(event.shiftKey?-1:1)];
  next?.focus();next?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
export function salesIssueTarget(message) {
 const text=message.toLowerCase();
 if(text.includes('payment method'))return {step:1,id:'sale-payment-method'};
 if(text.includes('customer name'))return {step:2,id:'sale-customer-name'};
 if(text.includes('customer phone'))return {step:2,id:'sale-customer-phone'};
 if(text.includes('customer address'))return {step:2,id:'sale-customer-address'};
 if(text.includes('dispatch date'))return {step:1,id:'sale-dispatch-date'};
 if(text.includes('cash discount'))return {step:1,id:'sale-cash-discount'};
 if(text.includes('date of sale'))return {step:1,id:'sale-date'};
 if(/amount received|amount paid|advance|split|payment|discount.*bill|bill amount/.test(text))return {step:1,id:text.includes('split')?'sale-payment-method':'sale-advance'};
 for(const [word,id] of [['quantity','sale-quantity'],['colour','sale-product-colour'],['size','sale-product-size'],['brand','sale-product-brand'],['model','sale-product-model'],['mrp','sale-product-mrpSticker'],['tax','sale-product-taxPercent'],['discount','sale-product-discountPercent'],['delivery','sale-delivery-source']])if(text.includes(word))return {step:0,id};
 if(text.includes('product') || text.includes('quantity') || text.includes('colour') || text.includes('size') || text.includes('delivery') || text.includes('brand') || text.includes('model') || text.includes('mrp') || text.includes('tax') || text.includes('discount'))return {step:0};
 return {step:3};
}
