import {test} from 'node:test';
import assert from 'node:assert/strict';
import {missingSaleFields,editableDeliveryMode} from './salesValidation.js';
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


test('own-store mixed delivery validates each product rather than a whole-invoice choice',()=>{
 const sale={ownedShowroom:true,customerName:'Customer',customerPhone:'9000000000',customerAddress:'Address',salesDate:'2026-10-26',dispatchDate:'2026-10-27',items:[{fulfillmentMode:'FACTORY_DELIVERY'},{fulfillmentMode:'LOCAL_STOCK'}]};
 assert.deepEqual(missingSaleFields(sale),[]);
 assert.ok(missingSaleFields({...sale,items:[{fulfillmentMode:'FACTORY_DELIVERY'},{}]}).includes('Customer needs / delivery option'));
});

test('saved factory choices normalize for editing without changing other delivery sources',()=>{
 assert.deepEqual(['LOCAL_STOCK','FACTORY_CUSTOMER','FACTORY_CUSTOMER','FACTORY_CUSTOMER'].map(editableDeliveryMode),['LOCAL_STOCK','FACTORY_DELIVERY','FACTORY_DELIVERY','FACTORY_DELIVERY']);
 assert.equal(editableDeliveryMode('LINKED_OUTLET_STOCK'),'LINKED_OUTLET_STOCK');
});
