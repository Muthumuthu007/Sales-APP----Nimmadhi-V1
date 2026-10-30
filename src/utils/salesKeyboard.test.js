import test from 'node:test';
import assert from 'node:assert/strict';
import {salesEnterKey,visibleSalesControls,salesIssueTarget} from './salesKeyboard.js';
const control=(tag='INPUT',other={})=>({tagName:tag,tabIndex:0,getClientRects:()=>[{}],closest:()=>null,getAttribute:()=>null,focus(){this.focused=true;},scrollIntoView(){},...other});
const event=(target,root,other={})=>({target,currentTarget:root,key:'Enter',preventDefault(){this.prevented=true;},...other});
test('Enter and Shift Enter follow visible editable fields and action buttons',()=>{
 const first=control(),hidden=control('INPUT',{getClientRects:()=>[]}),readonly=control('INPUT',{readOnly:true}),second=control('SELECT'),action=control('BUTTON');
 const root={querySelectorAll:()=>[first,hidden,readonly,second,action]};
 assert.deepEqual(visibleSalesControls(root),[first,second,action]);
 const e=event(first,root);salesEnterKey(e);assert.equal(e.prevented,true);assert.equal(second.focused,true);
 salesEnterKey(event(second,root,{shiftKey:true}));assert.equal(first.focused,true);
 salesEnterKey(event(second,root));assert.equal(action.focused,true);
});
test('search boxes, buttons, textarea and composing text retain Enter behavior',()=>{
 for(const target of [control('BUTTON'),control('TEXTAREA'),control('INPUT',{closest:()=>({})})]){
  const e=event(target,{querySelectorAll:()=>{throw Error('must not advance');}});salesEnterKey(e);assert.equal(e.prevented,undefined);
 }
 const e=event(control(),{}, {nativeEvent:{isComposing:true}});salesEnterKey(e);assert.equal(e.prevented,undefined);
});
test('missing details lead to their correct step and editable field',()=>{
 assert.deepEqual(salesIssueTarget('Customer phone number is required.'),{step:2,id:'sale-customer-phone'});
 assert.deepEqual(salesIssueTarget('Dispatch date is required.'),{step:1,id:'sale-dispatch-date'});
 assert.deepEqual(salesIssueTarget('Colour: Please fill out this field.'),{step:0,id:'sale-product-colour'});
 assert.deepEqual(salesIssueTarget('Split payment amounts must equal the amount received.'),{step:1,id:'sale-payment-method'});
});
