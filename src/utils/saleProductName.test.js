import {test} from 'node:test';import assert from 'node:assert/strict';import {saleProductName,factoryProductName} from './saleProductName.js';
test('display follows the actual custom size without changing catalogue identity',()=>{
 assert.equal(saleProductName('75X60X4 NIM 100S COIR','75 × 56 × 4'),'75X56X4 NIM 100S COIR');
 assert.equal(saleProductName('LATEX PILLOWS','-'),'LATEX PILLOWS');
 assert.equal(saleProductName('75X60X4 NIM 100S COIR','Standard'),'75X60X4 NIM 100S COIR');
});
test('factory uses only this product saved sale sizes',()=>{
 const item={product_id:'A',productName:'75X60X4 NIM 100S COIR'};
 assert.equal(factoryProductName({salesSpecifications:[{productId:'A',size:'75x56x4'},{productId:'B',size:'72x30x4'}]},item),'75X56X4 NIM 100S COIR');assert.equal(item.productName,'75X60X4 NIM 100S COIR');
});
