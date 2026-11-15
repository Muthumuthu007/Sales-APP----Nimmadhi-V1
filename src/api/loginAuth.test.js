import {test} from 'node:test';import assert from 'node:assert/strict';
import api from './axios.js';
test('login omits the previous token while protected requests retain it',async()=>{
 const old=globalThis.sessionStorage;
 globalThis.sessionStorage={getItem:key=>({token:'old-stall-token',role:'STALL'})[key] || null};
 try{
  const adapter=async config=>{if(config.url.replace(/\/$/,'')==='/login')assert.equal(config.headers.get('Authorization'),undefined);else assert.equal(config.headers.get('Authorization'),'Bearer old-stall-token');return {data:{ok:true},status:200,statusText:'OK',headers:{},config};};
  await api.post('/login',{username:'test',password:'test-only'},{adapter,headers:{Authorization:'Bearer stale-default'}});
  await api.post('/login/',{username:'test',password:'test-only'},{adapter});
  await api.get('/products',{adapter});
 }finally{globalThis.sessionStorage=old;}
});

test('view-only admins can read and list employees but mutations never reach the adapter',async()=>{
 const old=globalThis.sessionStorage;let calls=0;
 globalThis.sessionStorage={getItem:key=>({token:'test',role:'MANAGER',adminAccess:JSON.stringify({restricted:true,accessMode:'READ_ONLY'})})[key] || null};
 const adapter=async config=>{calls++;return {data:{ok:true},status:200,statusText:'OK',headers:{},config};};
 try{
  await api.get('/manager/orders',{adapter});
  await api.get('/manager/sales-record?export=xlsx',{adapter});
  await api.post('/manager/employees/list',{outletId:'NIM001'},{adapter});
  for(const [method,url] of [['post','/manager/orders/O1/approve'],['post','/factory/loadplans/P1/dispatch'],['patch','/manager/employees/E1/salary'],['delete','/outlets/OUT1']])await assert.rejects(api.request({method,url,data:{},adapter}),/view only/);
  assert.equal(calls,3);
 }finally{globalThis.sessionStorage=old;}
});
