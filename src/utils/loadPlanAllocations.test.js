import test from 'node:test';import assert from 'node:assert/strict';
import {allocationPayload,splitAllocation} from './loadPlanAllocations.js';
const item={productId:'A',productName:'Mattress A',quantity:20};
const factory={...item,id:'a',sourceType:'FACTORY',sourceLocationId:'FACTORY'};
test('twenty splits into ten factory and ten godown without changing product identity',()=>{
 const rows=splitAllocation([factory],0,'b');assert.deepEqual(rows.map(r=>r.quantity),[10,10]);assert.equal(rows[1].productId,'A');
 rows[1].sourceLocationId='GD1';assert.deepEqual(allocationPayload([item],rows).allocations,[{productId:'A',quantity:10,sourceType:'FACTORY'},{productId:'A',quantity:10,sourceType:'GODOWN',sourceLocationId:'GD1'}]);
});
test('under/over assigned, invalid quantities, missing godown cannot save',()=>{
 for(const quantity of ['',0,-1,1.5,true,19,21])assert.ok(allocationPayload([item],[{...factory,quantity}]).error);
 assert.ok(allocationPayload([item],[{...factory,sourceType:'GODOWN',sourceLocationId:''}]).error);
});
test('every approved product must balance independently, not just the plan total',()=>{
 assert.ok(allocationPayload([item,{productId:'B',quantity:10}],[{...factory,quantity:10},{...factory,productId:'B',quantity:20}]).error);
});
test('duplicates for the same source combine into one reservation line',()=>{
 const row={...factory,sourceType:'GODOWN',sourceLocationId:'GD1',quantity:'10'};
 assert.deepEqual(allocationPayload([item],[row,row]).allocations,[{productId:'A',quantity:20,sourceType:'GODOWN',sourceLocationId:'GD1'}]);
});
test('odd and single quantities keep exact totals and metadata',()=>{
 const row={...factory,quantity:3,customSize:{length:80}};
 const split=splitAllocation([row],0,'b');assert.deepEqual(split.map(r=>r.quantity),[2,1]);assert.deepEqual(split[1].customSize,row.customSize);
 const single=[{...row,quantity:1}];assert.equal(splitAllocation(single,0,'b'),single);
});
