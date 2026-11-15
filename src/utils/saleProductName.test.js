import {test} from 'node:test';import assert from 'node:assert/strict';import {saleProductName,factoryProductName,customProductName} from './saleProductName.js';
test('display follows the actual custom size without changing catalogue identity',()=>{
 assert.equal(saleProductName('75X60X4 NIM 100S COIR','75 × 56 × 4'),'75X56X4 NIM 100S COIR');
 assert.equal(saleProductName('LATEX PILLOWS','-'),'LATEX PILLOWS');
 assert.equal(saleProductName('75X60X4 NIM 100S COIR','Standard'),'75X60X4 NIM 100S COIR');
});
test('factory uses only this product saved sale sizes',()=>{
 const item={product_id:'A',productName:'75X60X4 NIM 100S COIR'};
 assert.equal(factoryProductName({salesSpecifications:[{productId:'A',size:'75x56x4'},{productId:'B',size:'72x30x4'}]},item),'75X56X4 NIM 100S COIR');assert.equal(item.productName,'75X60X4 NIM 100S COIR');
});

test('cot and mattress names both use saved custom dimensions on existing bills',()=>{
 assert.equal(saleProductName('75X60 COT','75x48'),'75X48 COT');
 assert.equal(saleProductName('75X60 COT','75 × 48'),'75X48 COT');
 assert.equal(saleProductName('75X60X6 NIM PRAKASAM BONNELL','75 × 48 × 6'),'75X48X6 NIM PRAKASAM BONNELL');
 assert.equal(saleProductName('75X60 COT','80.5 × 31'),'80.5X31 COT');
 assert.equal(saleProductName('MEMORY NECK PILLOW',''),'MEMORY NECK PILLOW');
});

test('custom orders replace base sizes in their names including older saved annotations',()=>{
 const size={length:'72.00',width:38,thickness:6,unit:'inches'};
 assert.equal(customProductName('72X36X6 NIM MEMORY',size),'72X38X6 NIM MEMORY');
 assert.equal(customProductName('72X36X6 NIM MEMORY · Customized: 72 × 38 × 6 inches',size),'72X38X6 NIM MEMORY');
 assert.equal(customProductName('72X36X6 NIM MEMORY',{length:180,width:95,unit:'cm'}),'180X95 cm NIM MEMORY');
 assert.equal(customProductName('72X36X6 NIM MEMORY',null),'72X36X6 NIM MEMORY');
});
