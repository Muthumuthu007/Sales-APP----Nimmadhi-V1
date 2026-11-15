import {test} from 'node:test';import assert from 'node:assert/strict';import{baseThickness,customOrderSize}from'./customOrderSize.js';
test('base thickness is retained while only custom length and width change',()=>{
 assert.equal(baseThickness('72X36X5 NIM MEMORY'),5);
 assert.deepEqual(customOrderSize('72X36X5 NIM MEMORY',{length:72,width:38,thickness:99,unit:'inches'}),{length:72,width:38,thickness:5,unit:'inches'});
 assert.equal(customOrderSize('72X36X8 OTHER',{length:75,width:48,unit:'inches'}).thickness,8);
});
test('length and width in centimetres are converted without changing physical thickness',()=>{
 assert.deepEqual(customOrderSize('72X36X5 NIM MEMORY',{length:182.88,width:96.52,unit:'cm'}),{length:72,width:38,thickness:5,unit:'inches'});
});
test('unknown base thickness or invalid dimensions cannot create a custom order',()=>{
 assert.equal(baseThickness('FINE PILLOWS'),null);assert.throws(()=>customOrderSize('Unknown',{length:72,width:38,unit:'inches'}));assert.throws(()=>customOrderSize('72X36X5 BED',{length:0,width:38,unit:'inches'}));
});
