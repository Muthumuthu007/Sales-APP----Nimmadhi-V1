import { test } from 'node:test';
import assert from 'node:assert/strict';
import { complimentaryForProduct } from './orderComplimentary.js';
test('order summary shows only the selected product and group complimentary offers', () => {
  const offers = [
    {offerId:'product',scope:'PRODUCT',productId:'A',freeQuantity:2},
    {offerId:'other',scope:'PRODUCT',productId:'B',freeQuantity:2},
    {offerId:'group',scope:'GROUP',groupId:'G1',freeQuantity:1},
    {offerId:'all',scope:'OUTLET',freeQuantity:1},
    {offerId:'discount',scope:'PRODUCT',productId:'A',freeQuantity:0},
  ];
  assert.deepEqual(complimentaryForProduct(offers,'A','G1').map(o=>o.offerId), ['product','group','all']);
  assert.deepEqual(complimentaryForProduct(offers,'C',undefined).map(o=>o.offerId), ['all']);
});
