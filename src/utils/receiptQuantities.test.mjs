import test from 'node:test';
import assert from 'node:assert/strict';
import {receiptSubmission} from './receiptQuantities.js';
const items=[{product_id:'B',productName:'Mattress',remainingQty:10},{product_id:'P',productName:'Complimentary pillows',remainingQty:20,isFree:true}];
test('receipt needs explicit complimentary confirmation',()=>assert.match(receiptSubmission(items,{B:10,P:''}).error,/Complimentary pillows/));
test('partial gifts stay pending and only actual received quantities are sent',()=>assert.deepEqual(receiptSubmission(items,{B:10,P:12}),{receivedItems:[{product_id:'B',qty:10},{product_id:'P',qty:12}]}));
test('zero gifts is an explicit non-receipt',()=>assert.deepEqual(receiptSubmission(items,{B:10,P:0}),{receivedItems:[{product_id:'B',qty:10}]}));
test('rejects invalid and excessive quantities',()=>{for(const p of [-1,1.5,21,'bad'])assert.ok(receiptSubmission(items,{B:10,P:p}).error);assert.ok(receiptSubmission(items,{B:0,P:0}).error)});
