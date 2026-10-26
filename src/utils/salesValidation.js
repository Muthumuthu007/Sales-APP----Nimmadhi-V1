export function missingSaleFields({items = [], customerName, customerPhone, customerAddress, salesDate, ownedShowroom, dispatchDate, fulfillmentMode}) {
  const missing = [];
  if (!salesDate) missing.push('Date of sale');
  if (ownedShowroom && !customerName?.trim()) missing.push('Customer name');
  if (ownedShowroom && !customerPhone?.trim()) missing.push('Customer phone number');
  if (ownedShowroom && !customerAddress?.trim()) missing.push('Customer address');
  if (ownedShowroom && !dispatchDate) missing.push('Dispatch date');
  if (ownedShowroom && !fulfillmentMode && (!items.length || items.some(item => !item.fulfillmentMode))) missing.push('Customer needs / delivery option');
  if (!items.length) missing.push('Product and quantity — add at least one item');
  return missing;
}
