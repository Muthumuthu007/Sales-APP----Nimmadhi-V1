export const emptyShowroomItem = { brand: 'NIM', model: '', colour: '', size: '', mrpSticker: '', discountPercent: '', taxPercent: '18', scheme: '' };
const scaled = value => {
  const text = String(value ?? '').trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};
export function showroomPrice(item) {
  const mrp = scaled(item.mrpSticker), discount = scaled(item.discountPercent), tax = scaled(item.taxPercent ?? '18');
  const quantity = Number(item.quantity ?? item.qty ?? 1);
  if (mrp === null || mrp <= 0n || discount === null || discount > 9999n || tax === null || tax > 10000n || !Number.isSafeInteger(quantity) || quantity < 1) return null;
  const unit = (mrp * (10000n - discount) + 5000n) / 10000n;
  const total = unit * BigInt(quantity);
  const denominator = 10000n + tax;
  const taxable = (total * 10000n + denominator / 2n) / denominator;
  return { value: Number(unit) / 100, totalSalesValue: Number(total) / 100, taxableValue: Number(taxable) / 100, taxAmount: Number(total - taxable) / 100 };
}
