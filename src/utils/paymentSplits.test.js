import test from 'node:test';import assert from 'node:assert/strict';
import {splitPayments,paymentDescription} from './paymentSplits.js';
test('split receipts total exact paise and omit unused methods',()=>{
 assert.deepEqual(splitPayments({CASH:'1000',UPI:'1000',CARD:''}),{payments:[{paymentMethod:'CASH',amount:1000},{paymentMethod:'UPI',amount:1000}],total:2000});
 assert.equal(splitPayments({CASH:'.1'}),null);
 assert.equal(splitPayments({CASH:'0.10',UPI:'0.20'}).total,.30);
 for(const value of ['-1','1.111','NaN','Infinity'])assert.equal(splitPayments({CASH:value}),null);
 assert.equal(splitPayments({CASH:'0',UPI:'',CARD:'500'}).payments.length,1);
 assert.match(paymentDescription(splitPayments({CASH:1000,UPI:1000}).payments),/CASH.*UPI/);
});
