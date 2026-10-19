import test from 'node:test';
import assert from 'node:assert/strict';
import {idempotentPost} from './idempotent.js';
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key),data};};
test('a lost response retains ID and retry uses the same ID; next completed sale gets new ID',async()=>{
 const store=storage();const ids=[];let fail=true;
 const api={post:async(_path,payload)=>{ids.push(payload.requestId);if(fail){fail=false;throw Error('Timeout');}return {ok:true};}};
 await assert.rejects(idempotentPost(api,'/sales',{product:'A',quantity:1},store));
 await idempotentPost(api,'/sales',{product:'A',quantity:1},store);
 await idempotentPost(api,'/sales',{product:'A',quantity:1},store);
 assert.equal(ids[0],ids[1]);assert.notEqual(ids[1],ids[2]);assert.equal(store.data.size,0);
});
test('changed payment or account uses a distinct operation ID; sensitive payload is not stored',async()=>{
 const store=storage();const ids=[];const api={post:async(_path,payload)=>{ids.push(payload.requestId);throw Error('Timeout');}};
 await assert.rejects(idempotentPost(api,'/payment',{amount:300,customerName:'PrivateCustomer'},store));
 await assert.rejects(idempotentPost(api,'/payment',{amount:400,customerName:'PrivateCustomer'},store));
 store.setItem('username','another-user');await assert.rejects(idempotentPost(api,'/payment',{amount:300,customerName:'PrivateCustomer'},store));
 assert.equal(new Set(ids).size,3);
 assert.ok(!JSON.stringify([...store.data.entries()]).includes('PrivateCustomer'));
});
