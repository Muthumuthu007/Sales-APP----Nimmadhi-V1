import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outletAvailableStock} from './salesStock.js';
test('outlet availability uses product ID, shows zero for missing stock and excludes reserved units',()=>{
 const stock=[{productId:'A',closingQty:10,reservedQty:3},{product_id:'B',closingQty:8,availableQty:2}];
 assert.equal(outletAvailableStock(stock,'A'),7);
 assert.equal(outletAvailableStock(stock,'B'),2);
 assert.equal(outletAvailableStock(stock,'C'),0);
 assert.equal(outletAvailableStock([{productId:'A',closingQty:-1}],'A'),0);
});
