export function receiptSubmission(items, quantities) {
  const receivedItems=[];
  for (const item of items) {
    const raw=quantities[item.product_id];
    const name=item.productName || item.product_id;
    if(raw === '' || raw == null) return {error:`Enter the received quantity for ${name}. Enter 0 if it has not arrived.`};
    const qty=Number(raw);
    if(!Number.isInteger(qty) || qty<0 || qty>Number(item.remainingQty)) return {error:`Enter a whole number from 0 to ${item.remainingQty} for ${name}.`};
    if(qty>0)receivedItems.push({product_id:item.product_id,qty});
  }
  return receivedItems.length?{receivedItems}:{error:'No items were received. Enter at least one positive quantity to confirm receipt.'};
}
