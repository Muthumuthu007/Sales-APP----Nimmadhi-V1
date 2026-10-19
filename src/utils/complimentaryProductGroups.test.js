import test from 'node:test';import assert from 'node:assert/strict';
import {complimentaryProductGroups} from './complimentaryProductGroups.js';
const products=[{productId:'A',productName:'Mattress A',groupId:'G'},{productId:'B',productName:'Mattress B',groupId:'G'}];
const rule=(id,ids,free,qty)=>({offerId:id,scope:'GROUP',groupId:'G',includedProductIds:ids,freeProductName:free,freeQuantity:qty});
test('one product card holds pillows and comforter together',()=>{
 const result=complimentaryProductGroups(products,[rule('1',['A'],'Pillow',2),rule('2',['A'],'Comforter',1)]);
 assert.equal(result.products.length,1);assert.equal(result.products[0].offers.length,2);assert.deepEqual(result.products[0].offers.map(x=>x.freeQuantity),[2,1]);
});
test('different products in the same group retain their own items',()=>{
 const result=complimentaryProductGroups(products,[rule('1',['A'],'Pillow',2),rule('2',['B'],'Comforter',1)]);
 assert.equal(result.products[0].offers[0].freeProductName,'Pillow');assert.equal(result.products[1].offers[0].freeProductName,'Comforter');
});
test('product and group rules combine without duplicating the main product',()=>{
 const result=complimentaryProductGroups([...products,products[0]],[rule('1',['A'],'Pillow',2),{offerId:'2',scope:'PRODUCT',productId:'A',freeProductName:'Comforter',freeQuantity:1}]);
 assert.equal(result.products.length,1);assert.equal(result.products[0].offers.length,2);
});
test('zero-member offers stay available as unassigned, never invented as active benefits',()=>{
 const result=complimentaryProductGroups(products,[rule('empty',[],'Pillow',2),rule('used',['A'],'Comforter',1)]);
 assert.equal(result.unassigned.length,1);assert.equal(result.products[0].offers.length,1);
});

test('legacy group without explicit checked products cannot leak to the group',()=>{
 const result=complimentaryProductGroups(products,[{offerId:'legacy',scope:'GROUP',groupId:'G',freeQuantity:1}]);
 assert.equal(result.products.length,0);assert.equal(result.unassigned.length,1);
});
