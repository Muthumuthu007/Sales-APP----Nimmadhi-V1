import test from 'node:test';
import assert from 'node:assert/strict';
import { showroomPrice } from './showroomPricing.js';
test('screenshot MRP less 60% gives 30851.20 with included tax', () => {
 const price = showroomPrice({ mrpSticker: '77128', discountPercent: '60', taxPercent: '18', quantity: 1 });
 assert.equal(price.value, 30851.20); assert.equal(price.totalSalesValue, 30851.20);
 assert.equal(price.taxAmount, 4706.12); assert.equal(price.taxableValue, 26145.08);
});
test('round unit value before multiplying quantity', () => {
 assert.equal(showroomPrice({mrpSticker:'1.05',discountPercent:'50',taxPercent:'18',quantity:3}).totalSalesValue,1.59);
});
test('invalid and incomplete price entries cannot calculate', () => {
 for (const fields of [{mrpSticker:''},{discountPercent:'100'},{discountPercent:'-1'},{quantity:1.5},{taxPercent:'101'}]) {
  assert.equal(showroomPrice({mrpSticker:'100',discountPercent:'10',taxPercent:'18',quantity:1,...fields}),null);
 }
});
import { showroomReportCsv } from './salesReportCsv.js';
test('report export preserves quoted customer text and avoids duplicate invoice totals', () => {
 const row = {saleReferenceId:'invoice',billAmount:100,quantity:1,totalAmount:50,customerName:'A "B", C',discountPercent:60,taxPercent:18,scheme:'2 pillows, 2 covers'};
 const csv = showroomReportCsv([row,row]);
 assert.ok(csv.includes('"A ""B"", C"')); assert.equal(csv.split('"100.00"').length-1,1);
 assert.ok(csv.includes('"60%"')); assert.ok(csv.includes('"18%"'));
});
