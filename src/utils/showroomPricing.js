export const emptyShowroomItem = { brand: 'NIM', model: '', colour: '', size: '', mrpSticker: '', discountPercent: '', discountAmount: '', taxPercent: '18', scheme: '' };
const scaled = value => {
  const text = String(value ?? '').trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};
export function showroomPrice(item) {
  const mrp = scaled(item.mrpSticker), discount = scaled(item.discountPercent), tax = scaled(item.taxPercent ?? '18');
  const quantity = Number(item.quantity ?? item.qty ?? 1);
  const amountMode=item.discountAmount!=null;
  const amount=amountMode?scaled(item.discountAmount):null;
  if (mrp === null || mrp <= 0n || (amountMode?(amount===null || amount>=mrp):(discount===null || discount>9999n)) || tax === null || tax > 10000n || !Number.isSafeInteger(quantity) || quantity < 1) return null;
  const unit = amountMode?mrp-amount:(mrp * (10000n - discount) + 5000n) / 10000n;
  const total = unit * BigInt(quantity);
  const denominator = 10000n + tax;
  const taxable = (total * 10000n + denominator / 2n) / denominator;
  return { discountAmount:Number(mrp-unit)/100,discountPercent:Number(((mrp-unit)*10000n+mrp/2n)/mrp)/100,value: Number(unit) / 100, totalSalesValue: Number(total) / 100, taxableValue: Number(taxable) / 100, taxAmount: Number(total - taxable) / 100 };
}

export function showroomBillPrice(grossAmount, cashDiscount = '0') {
  const gross = scaled(grossAmount), discount = scaled(cashDiscount || '0');
  if (gross === null || discount === null || discount >= gross) return null;
  const net = gross - discount;
  const rounded = ((net + 50n) / 100n) * 100n;
  return {cashDiscount: Number(discount) / 100, unroundedBillAmount: Number(net) / 100, roundOff: Number(rounded - net) / 100, netBillAmount: Number(rounded) / 100};
}

// A sale may override the saved default without changing the product price list.
export function showroomItemForProduct(current, option) {
  const name = option?.label?.split(' — max produce:')[0] || '';
  const size = name.match(/\d+(?:\.\d+)?[xX×]\d+(?:\.\d+)?[xX×]\d+(?:\.\d+)?/);
  return {...current, model: name, size: size ? size[0].replace(/[xX]/g, ' × ') : '',
    mrpSticker: option?.mrpSticker == null ? '' : String(option.mrpSticker)};
}

export function requiredShowroomFields(option) {
 return option?.isAccessory ? ['brand','model'] : ['brand','model','colour','size'];
}

// Legacy percentage-priced lines convert through their exact saved unit price.
export function discountAmountText(item) {
 if(item.discountAmount!=null)return String(item.discountAmount);
 const price=showroomPrice(item);return price?price.discountAmount.toFixed(2):'';
}
