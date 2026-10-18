import {test} from 'node:test';
import assert from 'node:assert/strict';
import {missingSaleFields} from './salesValidation.js';
test('empty NIM sale lists every missing required field for the popup', () => {
 const fields=missingSaleFields({ownedShowroom:true});
 for (const label of ['Date of sale','Customer name','Customer phone number','Customer address','Dispatch date','Customer needs / delivery option','Product and quantity — add at least one item']) assert.ok(fields.includes(label));
});
test('regular outlet does not require factory delivery details and complete NIM sale is accepted', () => {
 const sale={items:[{}],customerName:'Customer',customerPhone:'9000000000',customerAddress:'Address',salesDate:'2026-10-12'};
 assert.deepEqual(missingSaleFields(sale),[]);
 assert.deepEqual(missingSaleFields({...sale,ownedShowroom:true,dispatchDate:'2026-10-12',fulfillmentMode:'LOCAL_STOCK'}),[]);
});

test('regular outlets can submit without customer fields while NIM outlets still require them',()=>{
 const sale={items:[{}],salesDate:'2026-10-18'};
 assert.deepEqual(missingSaleFields({...sale,ownedShowroom:false}),[]);
 const missing=missingSaleFields({...sale,ownedShowroom:true,dispatchDate:'2026-10-18',fulfillmentMode:'LOCAL_STOCK'});
 assert.deepEqual(missing,['Customer name','Customer phone number','Customer address']);
});
