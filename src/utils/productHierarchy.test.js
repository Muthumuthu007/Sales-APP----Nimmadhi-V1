import test from 'node:test';import assert from 'node:assert/strict';
import {productionOption,groupedProductOptions} from './productHierarchy.js';
test('same subgroup names in separate main groups retain their own durable IDs',()=>{
 const options=[{value:'bed',label:'Bed',groupId:'m1',group:'Mattress → Custom',mainGroupName:'Mattress'},{value:'cover',label:'Cover',groupId:'a1',group:'Accessories → Custom',mainGroupName:'Accessories'}];
 const categories=groupedProductOptions(options);assert.equal(categories.length,2);assert.equal(categories[0].groups[0].id,'m1');assert.equal(categories[1].groups[0].id,'a1');
});
test('accessory picker retains production hierarchy metadata and quantity selection uses product IDs',()=>{
 const option=productionOption({productId:'protector',productName:'Protector',groupId:'P',groupPath:'Accessories → PROTECTORS',mainGroupName:'Accessories',isAccessory:true});
 assert.equal(option.value,'protector');assert.equal(option.group,'Accessories → PROTECTORS');assert.equal(option.isAccessory,true);
});
test('unclassified groups remain separate and placeholders do not create groups',()=>{
 const groups=groupedProductOptions([{value:'',label:'Select product'},{value:'p',label:'Product',groupId:'unknown',group:'OTHERS'}]);
 assert.equal(groups.length,1);assert.equal(groups[0].name,'Needs classification');assert.equal(groups[0].groups[0].options.length,1);
});

test('order groups nest every level while preserving IDs and products at parent levels',async()=>{
 const {orderGroupTree}=await import('./productHierarchy.js');
 const tree=orderGroupTree([{name:'Mattress',groups:[
  {id:'parent-id',label:'Mattress → 100D',options:[{value:'p'}]},
  {id:'leaf-id',label:'Mattress → 100D → NIM 100D → Premium',options:[{value:'a'},{value:'b'}]},
  {id:'other-id',label:'Mattress → Latex → Premium',options:[{value:'c'}]}
 ]}]);
 assert.equal(tree[0].count,4);
 const density=tree[0].children.find(n=>n.label==='100D');
 assert.equal(density.groups[0].id,'parent-id');
 assert.equal(density.children[0].children[0].groups[0].id,'leaf-id');
 assert.equal(tree[0].children.find(n=>n.label==='Latex').children[0].groups[0].id,'other-id');
});

test('ancestor IDs keep equally named branches distinct within one category',async()=>{
 const {orderGroupTree}=await import('./productHierarchy.js');
 const options=['a','b'].map(id=>productionOption({productId:`p-${id}`,productName:id,groupId:id,mainGroupName:'Accessories',groupPath:'Accessories → Custom',groupAncestors:[{id:'root',name:'Accessories'},{id,name:'Custom'}]}));
 const tree=orderGroupTree(groupedProductOptions(options));
 assert.deepEqual(tree[0].children.map(node=>node.id),['a','b']);
 assert.equal(tree[0].children[1].groups[0].options[0].value,'p-b');
});

test('product search entries keep each level and original option identity',async()=>{
 const {productListEntries,enrichProductOptions}=await import('./productHierarchy.js');
 const catalogue=[productionOption({productId:'bed',productName:'Standard',mainGroupName:'Mattress',groupId:'leaf',groupPath:'Mattress → Foam → Premium',groupAncestors:[{id:'m',name:'Mattress'},{id:'f',name:'Foam'},{id:'leaf',name:'Premium'}]})];
 const supplied={value:'sale-line-1',productId:'bed',label:'Custom 75X36X6 · 2 available',quantity:2};
 const options=enrichProductOptions([supplied],catalogue);const entries=productListEntries(options);
 assert.deepEqual(entries.filter(e=>e.kind==='group').map(e=>e.label),['Mattress','Foam','Premium']);
 assert.equal(entries.at(-1).option.value,'sale-line-1');assert.equal(entries.at(-1).option.quantity,2);assert.equal(entries.at(-1).option.label,supplied.label);assert.equal(supplied.groupId,undefined);
});
