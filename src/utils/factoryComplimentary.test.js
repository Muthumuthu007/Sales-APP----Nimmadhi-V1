import {test} from 'node:test';import assert from 'node:assert/strict';import {factorySchemeDetails} from './factoryComplimentary.js';
test('factory displays saved sale schemes for the exact product without including separately paid pillows',()=>{
 const order={salesSpecifications:[{productId:'A',scheme:'2 × FINE PILLOWS',quantity:1},{productId:'B',scheme:'',quantity:2},{productId:'C',scheme:'0',quantity:1}]};
 assert.deepEqual(factorySchemeDetails(order,{product_id:'A'}),[{scheme:'2 × FINE PILLOWS',quantity:1}]);assert.deepEqual(factorySchemeDetails(order,{product_id:'B'}),[]);assert.deepEqual(factorySchemeDetails(order,{product_id:'C'}),[]);
});
test('multiple same-product sales specifications are retained without multiplying scheme counts',()=>{
 assert.deepEqual(factorySchemeDetails({salesSpecifications:[{productId:'A',scheme:'2 pillows',quantity:3},{productId:'A',scheme:'1 comforter',quantity:1}]},{productId:'A'}),[{scheme:'2 pillows',quantity:3},{scheme:'1 comforter',quantity:1}]);
});
