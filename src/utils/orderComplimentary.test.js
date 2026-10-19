import { test } from 'node:test';
import assert from 'node:assert/strict';
import { complimentaryForProduct } from './orderComplimentary.js';
test('order summary shows only the selected product and group complimentary offers', () => {
  const offers = [
    {offerId:'product',scope:'PRODUCT',productId:'A',freeQuantity:2},
    {offerId:'other',scope:'PRODUCT',productId:'B',freeQuantity:2},
    {offerId:'group',scope:'GROUP',groupId:'G1',includedProductIds:['A'],freeQuantity:1},
    {offerId:'all',scope:'OUTLET',freeQuantity:1},
    {offerId:'discount',scope:'PRODUCT',productId:'A',freeQuantity:0},
  ];
  assert.deepEqual(complimentaryForProduct(offers,'A','G1').map(o=>o.offerId), ['product','group','all']);
  assert.deepEqual(complimentaryForProduct(offers,'C',undefined).map(o=>o.offerId), ['all']);
});

test('unchecked group products receive only their separate product offer', () => {
  const offers=[{offerId:'group',scope:'GROUP',groupId:'G',includedProductIds:['B'],freeQuantity:2,excludedProductIds:['A']},{offerId:'specific',scope:'PRODUCT',productId:'A',freeQuantity:1}];
  assert.deepEqual(complimentaryForProduct(offers,'A','G').map(offer=>offer.offerId),['specific']);
  assert.deepEqual(complimentaryForProduct(offers,'B','G').map(offer=>offer.offerId),['group']);
  assert.deepEqual(complimentaryForProduct(offers,'new-product','G').map(offer=>offer.offerId),[]);
});

test('two offers in the same group apply only to their assigned products', () => {
 const offers=[{offerId:'two-pillows',scope:'GROUP',groupId:'G',freeQuantity:2,includedProductIds:['A','B']},{offerId:'one-pillow',scope:'GROUP',groupId:'G',freeQuantity:1,includedProductIds:['C','D']}];
 assert.deepEqual(complimentaryForProduct(offers,'A','G').map(offer=>offer.freeQuantity),[2]);
 assert.deepEqual(complimentaryForProduct(offers,'C','G').map(offer=>offer.freeQuantity),[1]);
 assert.deepEqual(complimentaryForProduct(offers,'new-product','G'),[]);
 offers[0].includedProductIds=['B'];offers[1].includedProductIds.push('A');
 assert.deepEqual(complimentaryForProduct(offers,'A','G').map(offer=>offer.freeQuantity),[1]);
});
