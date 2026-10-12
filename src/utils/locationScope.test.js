import {test} from 'node:test';import assert from 'node:assert/strict';
import {locationOptions,outletLocation} from './locationScope.js';
test('location options group only explicitly assigned metadata, ignoring outlet display names',()=>{
 const options=locationOptions([{outletId:'C1',locationName:' Chennai '},{outletId:'C2',locationName:'CHENNAI'},{outletId:'M1',locationName:'Madurai'},{outletId:'U1',outletName:'Chennai store'}]);
 assert.deepEqual(options.map(option=>option.value),['','chennai','madurai','__UNASSIGNED__']);
 assert.equal(outletLocation({outletName:'Madurai store'}),'');
});
test('all locations remains available when there are no outlets',()=>assert.deepEqual(locationOptions([]),[{value:'',label:'All locations'}]));
