import test from 'node:test';
import assert from 'node:assert/strict';
import {salesDraftKey,readSalesDraft,writeSalesDraft,saleErrorDetails,uncertainSale,saleSubmissionIssues} from './salesDraft.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};
test('reload restores products, split advance, custom size and exact pending request scoped to account and outlet',()=>{
 const store=storage(),key=salesDraftKey('alice','NIM001');
 const form={salesItems:[{size:'75 × 56 × 4',quantity:1}],advanceAmount:'2000',advanceSplit:{CASH:'1000',UPI:'1000'},customerName:'Buyer'};
 const pending={requestId:crypto.randomUUID(),soldItems:form.salesItems};
 assert.equal(writeSalesDraft(store,key,form,pending),true);
 assert.deepEqual(readSalesDraft(store,key).form,form);assert.deepEqual(readSalesDraft(store,key).pending,pending);
 assert.equal(readSalesDraft(store,salesDraftKey('bob','NIM001')),null);
 assert.equal(readSalesDraft(store,salesDraftKey('alice','NIM002')),null);
});
test('storage errors and malformed drafts fail safely',()=>{
 assert.equal(readSalesDraft({getItem:()=>'{broken'},'x'),null);
 assert.equal(writeSalesDraft({setItem:()=>{throw Error('quota');}},'x',{}),false);
});
test('validation errors identify product number and field instead of raw JSON',()=>{
 assert.deepEqual(saleErrorDetails({soldItems:[{qty:['Invalid quantity.']},{fulfillmentMode:['Invalid source.']}]}),['Product 1 · Quantity: Invalid quantity.','Product 2 · Delivery source: Invalid source.']);
 assert.equal(uncertainSale({}),true);assert.equal(uncertainSale({response:{status:503}}),true);assert.equal(uncertainSale({response:{status:400}}),false);
});
test('blank received amount requires an explicit zero and oversized input is caught before submission',()=>{
 assert.equal(saleSubmissionIssues({advanceAmount:'',salesItems:[]},true).length,1);
 assert.deepEqual(saleSubmissionIssues({advanceAmount:'0',salesItems:[]},true),[]);
 assert.equal(saleSubmissionIssues({advanceAmount:'100',customerName:'a'.repeat(151),salesItems:[{quantity:1.5}]},true).length,2);
});
