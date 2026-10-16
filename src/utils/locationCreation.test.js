import test from 'node:test';import assert from 'node:assert/strict';
import {isLocationCreateDisabled} from './locationCreation.js';
const base={saving:false,locationType:'GODOWN',groupsLoading:false,selectedGroupIds:[]};
test('godown confirmation stays enabled without hidden product groups, even while groups load',()=>{
 assert.equal(isLocationCreateDisabled(base),false);
 assert.equal(isLocationCreateDisabled({...base,groupsLoading:true}),false);
});
test('outlet confirmation still requires loaded product groups and a selection',()=>{
 assert.equal(isLocationCreateDisabled({...base,locationType:'OUTLET'}),true);
 assert.equal(isLocationCreateDisabled({...base,locationType:'OUTLET',groupsLoading:true,selectedGroupIds:['A']}),true);
 assert.equal(isLocationCreateDisabled({...base,locationType:'OUTLET',selectedGroupIds:['A']}),false);
});
test('both location types prevent duplicate submissions while saving',()=>{
 for(const locationType of ['OUTLET','GODOWN'])assert.equal(isLocationCreateDisabled({...base,locationType,saving:true,selectedGroupIds:['A']}),true);
});
