import test from 'node:test';import assert from 'node:assert/strict';import {mappedMrp,mrpText} from './productMrp.js';
test('MRP matches durable product IDs and never derives price from cost or name',()=>{
 assert.equal(mappedMrp({product_id:'A',productName:'Same bed'},{A:'50020.00',B:'40000'}),50020);
 assert.equal(mappedMrp({productId:'B',productName:'Same bed'},{A:'50020.00',B:'40000'}),40000);
 assert.equal(mappedMrp({productId:'C',total_cost:123,price:100}),null);
 assert.equal(mappedMrp({value:'A'},{A:'50020.00'}),50020);
});
test('missing and invalid prices are explicit, and sale snapshots remain intact',()=>{
 for(const value of [null,undefined,'',0,-1,'invalid'])assert.equal(mappedMrp({mrpSticker:value}),null);
 const item={productId:'A',mrpSticker:'45000'};assert.equal(mappedMrp(item,{A:'50020'}),50020);assert.equal(item.mrpSticker,'45000');
 assert.equal(mrpText(null),'Not mapped');assert.ok(mrpText(50020).includes('50,020'));
});
