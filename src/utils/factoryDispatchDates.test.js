import test from 'node:test';
import assert from 'node:assert/strict';
import {factoryDispatchDateGroups} from './factoryDispatchDates.js';
test('today then upcoming dates ascending, overdue dates separate, undated last',()=>{
 const rows=[{orderId:'late',dispatchDate:'2026-10-28'},{orderId:'future2',dispatchDate:'2026-10-31'},{orderId:'missing'},{orderId:'today',dispatchDate:'2026-10-29'},{orderId:'future',dispatchDate:'2026-10-30'}];
 const original=structuredClone(rows);
 const groups=factoryDispatchDateGroups(rows,'2026-10-29');
 assert.deepEqual(groups.map(g=>g.date),['2026-10-29','2026-10-30','2026-10-31','2026-10-28','']);
 assert.deepEqual(groups.map(g=>g.kind),['today','upcoming','upcoming','overdue','undated']);
 assert.deepEqual(rows,original);
});
test('same-date orders grouped and sorted by reference without losing any orders',()=>{
 const groups=factoryDispatchDateGroups([{displayId:'ORD-10',dispatchDate:'2026-10-29'},{displayId:'ORD-2',dispatchDate:'2026-10-29'}],'2026-10-29');
 assert.equal(groups.length,1);assert.deepEqual(groups[0].orders.map(r=>r.displayId),['ORD-2','ORD-10']);
});
test('invalid dates stay visible in undated and empty lists stay empty',()=>{
 assert.deepEqual(factoryDispatchDateGroups([],'2026-10-29'),[]);
 const groups=factoryDispatchDateGroups([{dispatchDate:'2026-02-30'},{dispatchDate:'unknown'},{dispatchDate:null}],'2026-10-29');
 assert.equal(groups.length,1);assert.equal(groups[0].kind,'undated');assert.equal(groups[0].orders.length,3);
});
