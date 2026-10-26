import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stockGroups} from './stockGroups.js';
test('stock joins saved product IDs to production groups despite identical names',()=>{
 const rows=[{productId:'A',productName:'Bed',closingQty:3},{productId:'B',productName:'Bed',closingQty:5},{productId:'OLD',productName:'Bed',closingQty:2}];
 const catalogue=[{value:'A',mainGroupName:'Mattress',groupId:'G1',group:'Mattress → Foam'},{value:'B',mainGroupName:'Accessories',groupId:'G2',group:'Accessories → Pillows'}];
 const grouped=stockGroups(rows,catalogue);
 assert.equal(grouped[0].groups[0].options[0].stock,rows[0]);
 assert.equal(grouped[1].groups[0].options[0].stock,rows[1]);
 assert.equal(grouped[2].name,'Needs classification');
 assert.equal(grouped.flatMap(m=>m.groups.flatMap(g=>g.options)).length,3);
});
