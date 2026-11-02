import test from 'node:test';
import assert from 'node:assert/strict';
import {sortFactoryDispatchOrders} from './factoryDispatchDates.js';
test('dispatch date sorting is chronological with undated orders last',()=>{
 const rows=[{orderId:'future',dispatchDate:'2026-11-03'},{orderId:'missing'},{orderId:'today',dispatchDate:'2026-11-02'},{orderId:'old',dispatchDate:'2026-10-29'}];
 const original=structuredClone(rows);
 assert.deepEqual(sortFactoryDispatchOrders(rows).map(r=>r.orderId),['old','today','future','missing']);
 assert.deepEqual(rows,original);
});
test('order ID sorting uses displayed reference and numeric order',()=>{
 const rows=[{orderId:'uuid-a',displayId:'ORD-10'},{orderId:'uuid-b',displayId:'ORD-2'},{orderId:'ORD-3'}];
 assert.deepEqual(sortFactoryDispatchOrders(rows,'ORDER_ID').map(r=>r.displayId || r.orderId),['ORD-2','ORD-3','ORD-10']);
});
test('matching dates sort by order ID and invalid dates remain visible at end',()=>{
 const rows=[{displayId:'ORD-10',dispatchDate:'2026-11-02'},{displayId:'ORD-2',dispatchDate:'2026-11-02'},{displayId:'ORD-4',dispatchDate:'2026-02-30'},{displayId:'ORD-5',dispatchDate:'unknown'}];
 assert.deepEqual(sortFactoryDispatchOrders(rows).map(r=>r.displayId),['ORD-2','ORD-10','ORD-4','ORD-5']);
 assert.deepEqual(sortFactoryDispatchOrders([]),[]);
});
