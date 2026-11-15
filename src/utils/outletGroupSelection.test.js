import test from 'node:test';import assert from 'node:assert/strict';import {outletGroupSelection} from './outletGroupSelection.js';
test('hidden inherited headings and retired IDs never enter replacement payload',()=>{
 const access={allowedGroupIds:['main','A','B','deleted'],groups:[{groupId:'main',groupKind:'MAIN'},{groupId:'A'},{groupId:'B'}]};
 assert.deepEqual(outletGroupSelection(access),['A','B']);assert.deepEqual(outletGroupSelection(access,['main','B','B','deleted']),['B']);assert.deepEqual(access.allowedGroupIds,['main','A','B','deleted']);
});
test('an empty selection stays empty for the form to validate rather than restoring all groups',()=>{assert.deepEqual(outletGroupSelection({groups:[{groupId:'A'}]},[]),[]);});
