import {test} from 'node:test';import assert from 'node:assert/strict';
import {orderContents} from './orderContents.js';
const bed={product_id:'B',productName:'72X36X6 Bed',orderedQty:2,freeItems:[{product_id:'P',productName:'Pillows',quantity:2},{product_id:'C',productName:'Comforter',quantity:1}]};
test('ordered products and absolute gifts have independent totals and parent links',()=>{
 const result=orderContents([bed]);assert.equal(result.productTotal,2);assert.equal(result.complimentaryTotal,3);assert.equal(result.complimentary.length,2);assert.equal(result.complimentary[0].complimentaryFor[0].productId,'B');
});
test('flat dispatched gift rows override nested representations without double counting',()=>{
 const result=orderContents([bed,{product_id:'P',productName:'Pillows',quantity:2,isFree:true},{product_id:'C',productName:'Comforter',quantity:1,isFree:true}]);assert.equal(result.products.length,1);assert.equal(result.complimentary.length,2);assert.equal(result.complimentaryTotal,3);
});
test('two ordered products sharing gifts keep both associations and actual flat quantity',()=>{
 const second={...bed,product_id:'B2',productName:'Another bed'};
 const result=orderContents([bed,second,{product_id:'P',quantity:4,isFree:true},{product_id:'C',quantity:2,isFree:true}]);assert.equal(result.complimentaryTotal,6);assert.equal(result.complimentary[0].complimentaryFor.length,2);assert.equal(result.productTotal,4);
});
test('saved offers remain estimates, distinct from approved quantities',()=>{
 const result=orderContents([{product_id:'B',orderedQty:3,complimentaryOffers:[{offerId:'O',freeProductId:'P',freeProductName:'Pillow',freeQuantity:2},{currentConfiguration:true,freeProductId:'C',freeQuantity:10}]}]);assert.equal(result.complimentaryTotal,0);assert.equal(result.offerTotal,6);assert.equal(result.complimentary.length,1);assert.equal(result.complimentary[0].isOfferEstimate,true);
});
test('explicit gifts take precedence over offers and readonly grouping never changes source data',()=>{
 const source=[{...bed,complimentaryOffers:[{freeProductId:'P',freeQuantity:100}]}];const before=structuredClone(source);const result=orderContents(source);assert.equal(result.offerTotal,0);assert.deepEqual(source,before);
});
test('custom dimensions stay in parent description and source IDs are retained',()=>{
 const result=orderContents([{...bed,customSize:{length:72,width:38,thickness:6,unit:'inches'}}]);assert.equal(result.complimentary[0].complimentaryFor[0].productName,'72X38X6 Bed');assert.equal(result.complimentary[0].product_id,'P');
});
test('receipt progress and parent metadata survive flat complimentary separation',()=>{
 const gift={product_id:'P',quantity:2,remainingQty:1,isFree:true,parentProductId:'B',parentProductName:'Bed'};const result=orderContents([gift]);assert.equal(result.productTotal,0);assert.equal(result.complimentaryTotal,2);assert.equal(result.complimentary[0].remainingQty,1);assert.equal(result.complimentary[0].complimentaryFor[0].productName,'Bed');
});
test('missing gift quantities stay unknown rather than becoming invented quantities',()=>{
 const result=orderContents([{product_id:'B',quantity:1,freeItems:[{productId:'P',productName:'Pillow'}]}]);assert.equal(result.complimentary[0].quantity,undefined);assert.equal(result.complimentaryTotal,0);
});
