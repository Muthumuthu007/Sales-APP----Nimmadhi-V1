import {test} from 'node:test';import assert from 'node:assert/strict';import {dispatchGroups,dispatchGroupLabel} from './dispatchGroups.js';
test('vehicle load groups multiple orders together without using production groups',()=>{
 const rows=[{vehicleLoadId:'L',orderId:'A',loadPlanId:'P',groupId:'G1'},{vehicleLoadId:'L',orderId:'B',loadPlanId:'Q',groupId:'G2'},{vehicleLoadId:'M',orderId:'A',loadPlanId:'P',groupId:'G1'}];
 const result=dispatchGroups(rows);assert.equal(result.length,2);assert.deepEqual(result[0].rows,rows.slice(0,2));
});
test('unassigned source plans and unknown legacy records never merge accidentally',()=>{
 const rows=[{orderId:'A',loadPlanId:'P',sourceType:'FACTORY'},{orderId:'B',loadPlanId:'P',sourceType:'FACTORY'},{orderId:'A',loadPlanId:'P',sourceType:'GODOWN',sourceLocationId:'G1'},{dispatchId:'D1'},{dispatchId:'D2'}];assert.equal(dispatchGroups(rows).length,5);
});
test('load labels use the saved number or the established load prefix',()=>{assert.equal(dispatchGroupLabel({vehicleLoadId:'abcdefgh-123'}),'LOAD-ABCDEFGH');assert.equal(dispatchGroupLabel({vehicleLoadId:'a',vehicleLoadNumber:'LOAD-0001'}),'LOAD-0001');assert.equal(dispatchGroupLabel({loadPlanId:'p',planDisplayId:'PLAN-0104'}),'PLAN-0104');});
