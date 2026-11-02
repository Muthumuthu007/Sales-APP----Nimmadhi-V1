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

test('created date shows first-in orders first using timestamps across timezones',()=>{
 const rows=[{orderId:'3',createdAt:'2026-11-02T09:01:00+05:30'},{orderId:'1',createdAt:'2026-11-01T23:00:00Z'},{orderId:'2',createdAt:'2026-11-02T03:30:00Z'},{orderId:'4'}];
 const original=structuredClone(rows);
 assert.deepEqual(sortFactoryDispatchOrders(rows,'CREATED_DATE').map(r=>r.orderId),['1','2','3','4']);
 assert.deepEqual(rows,original);
});
test('created date retains invalid or missing dates last with numeric ID tie breaks',()=>{
 const rows=[{orderId:'ORD-10',createdAt:'2026-11-02T10:00:00+05:30'},{orderId:'ORD-2',createdAt:'2026-11-02T10:00:00+05:30'},{orderId:'ORD-20',createdAt:'2026-02-30'},{orderId:'ORD-30',createdAt:'bad'}];
 assert.deepEqual(sortFactoryDispatchOrders(rows,'CREATED_DATE').map(r=>r.orderId),['ORD-2','ORD-10','ORD-20','ORD-30']);
});
