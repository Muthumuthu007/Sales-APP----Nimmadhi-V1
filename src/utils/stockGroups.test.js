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

test('custom stock and free items use product links without merging row quantities',()=>{
 const catalogue=[{value:'bed',label:'Standard',mainGroupName:'Mattress',groupId:'g',group:'Mattress → Foam',groupAncestors:[{id:'m',name:'Mattress'},{id:'g',name:'Foam'}]}];
 const rows=[{product_id:'custom',baseProductId:'bed',quantity:2},{freeProductId:'bed',quantity:1},{product_id:'unknown',productName:'Looks like Foam',quantity:3}];
 const result=stockGroups(rows,catalogue);
 assert.equal(result[0].name,'Mattress');assert.equal(result[0].groups[0].options.length,2);assert.equal(result[0].groups[0].options[0].stock,rows[0]);assert.equal(result[1].name,'Needs classification');
});

 test('custom stock prefers the base hierarchy over a conflicting custom catalogue entry',()=>{
 const rows=[{productId:'CUSTOM#1',baseProductId:'BASE',closingQty:1}];
 const result=stockGroups(rows,[{value:'BASE',mainGroupName:'Mattress',groupId:'100D',group:'Mattress → 100D'},{value:'CUSTOM#1',mainGroupName:'Accessories',groupId:'OTHER',group:'Accessories → Other'}]);
 assert.equal(result[0].name,'Mattress');assert.equal(result[0].groups[0].options[0].groupId,'100D');
 });

test('custom stock keeps server base hierarchy when the base is absent from the visible catalogue',()=>{
 const result=stockGroups([{productId:'CUSTOM#1',baseProductId:'BASE',mainGroupName:'Mattress',groupId:'100D',groupPath:'Mattress → 100D'}],[{value:'CUSTOM#1',mainGroupName:'Accessories',groupId:'OTHER',group:'Accessories → Other'}]);
 assert.equal(result[0].name,'Mattress');assert.equal(result[0].groups[0].options[0].groupId,'100D');
});

test('custom receipt authoritative base hierarchy overrides incomplete visible catalogue',()=>{
 const row={productId:'CUSTOM#received',baseProductId:'BASE',mainGroupName:'Mattress',groupId:'100S',groupPath:'Mattress → 100S → NIM 100S',groupAncestors:[{id:'M',name:'Mattress'},{id:'100S',name:'100S'},{id:'NIM',name:'NIM 100S'}],closingQty:4};
 const result=stockGroups([row],[{value:'BASE',mainGroupName:'Needs classification',groupId:'UNCLASSIFIED',group:'Unclassified products'}]);
 assert.equal(result[0].name,'Mattress');assert.equal(result[0].groups[0].id,'100S');assert.equal(result[0].groups[0].options[0].stock.closingQty,4);
});
