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
