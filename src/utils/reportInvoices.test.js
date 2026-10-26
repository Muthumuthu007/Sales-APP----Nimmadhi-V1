import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reportInvoices} from './reportInvoices.js';
test('one invoice combines its products without merging another purchase by the same customer',()=>{
 const rows=[{outletId:'NIM1',saleReferenceId:'A',customerName:'Customer',billAmount:1000,advanceAmount:300,balanceDue:700,quantity:1},{outletId:'NIM1',saleReferenceId:'A',customerName:'Customer',billAmount:1000,quantity:2,workOrderNo:'ORD1'},{outletId:'NIM1',saleReferenceId:'B',customerName:'Customer',quantity:1}];
 const result=reportInvoices(rows);assert.equal(result.length,2);assert.equal(result[0].quantity,3);assert.equal(result[0].items.length,2);assert.equal(result[0].billAmount,1000);assert.deepEqual(result[0].workOrders,['ORD1']);assert.equal(rows[0].quantity,1);
});
test('legacy sales and identical references at other outlets remain separate',()=>{
 assert.equal(reportInvoices([{saleId:'A'},{saleId:'B'},{outletId:'NIM1',saleReferenceId:'C'},{outletId:'NIM2',saleReferenceId:'C'}]).length,4);
});
