import test from 'node:test';import assert from 'node:assert/strict';
import {employeeOutlets,employeeAtOutlet,mapEmployeeLocations,combineEmployeeIncentives} from './employeeLocations.js';
const outlets=[{outletId:'NIM1',locationName:'Madurai',outletName:'One'},{outletId:'UP2',locationName:'Madurai',outletName:'Two'},{outletId:'NIM3',locationName:'Chennai'},{outletId:'NIM4'}];
test('all locations, city and individual outlet filters use assigned location metadata',()=>{
 assert.equal(employeeOutlets(outlets).length,4);assert.deepEqual(employeeOutlets(outlets,'madurai').map(o=>o.outletId),['NIM1','UP2']);assert.equal(employeeOutlets(outlets,'chennai','NIM1').length,0);assert.equal(employeeOutlets(outlets,'__UNASSIGNED__')[0].outletId,'NIM4');
 const row=employeeAtOutlet({empId:'E',outletId:'wrong'},outlets[1]);assert.equal(row.outletId,'UP2');assert.equal(row.locationName,'Madurai');
});
test('multi-outlet loads retain association, bound requests and never silently omit failed outlets',async()=>{
 let active=0,max=0;const results=await mapEmployeeLocations(outlets,async outlet=>{active++;max=Math.max(max,active);await Promise.resolve();active--;return outlet.outletId;},2);
 assert.deepEqual(results,['NIM1','UP2','NIM3','NIM4']);assert.ok(max<=2);
 await assert.rejects(mapEmployeeLocations(outlets,async outlet=>{if(outlet.outletId==='UP2')throw Error('denied');return outlet;}),/denied/);
 const combined=combineEmployeeIncentives([{sales:{incentivePool:10,matchedQuantity:2},attendance:{eligiblePresentDays:12}},{sales:{incentivePool:20,matchedQuantity:3},attendance:{eligiblePresentDays:18}}]);
 assert.equal(combined.sales.incentivePool,30);assert.equal(combined.attendance.eligiblePresentDays,30);
});
