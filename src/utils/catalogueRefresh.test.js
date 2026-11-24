import {setImmediate} from 'node:timers';import test from 'node:test';import assert from 'node:assert/strict';import {startCatalogueRefresh,refreshOptionPrices} from './catalogueRefresh.js';
function fixture(){
 const win=new EventTarget(),doc=new EventTarget();doc.visibilityState='visible';let tick;win.setInterval=fn=>{tick=fn;return 1;};win.clearInterval=()=>{tick=null;};return {win,doc,tick:()=>tick?.()};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('refreshes on initial load, focus, visible tab and timer; ignores hidden tabs',async()=>{
 const f=fixture();let price=100,calls=0;const values=[];
 const stop=startCatalogueRefresh({...f,load:async()=>{calls++;return price;},onData:x=>values.push(x),onError:()=>assert.fail()});await flush();
 price=120;f.win.dispatchEvent(new Event('focus'));await flush();assert.deepEqual(values,[100,120]);
 f.doc.visibilityState='hidden';await f.tick();assert.equal(calls,2);f.doc.visibilityState='visible';price=130;f.doc.dispatchEvent(new Event('visibilitychange'));await flush();await f.tick();assert.deepEqual(values,[100,120,130,130]);stop();assert.equal(f.tick(),undefined);
});
test('prevents overlapping requests and discards responses after scope changes',async()=>{
 const f=fixture();let resolve;let calls=0;const values=[];const stop=startCatalogueRefresh({...f,load:()=>{calls++;return new Promise(r=>{resolve=r;});},onData:x=>values.push(x),onError:()=>assert.fail()});f.win.dispatchEvent(new Event('focus'));assert.equal(calls,1);stop();resolve('old outlet');await flush();assert.deepEqual(values,[]);
});
test('errors are surfaced and next refresh can recover',async()=>{
 const f=fixture();let fail=true,errors=0,data;const stop=startCatalogueRefresh({...f,load:async()=>{if(fail)throw Error('network');return 150;},onData:x=>{data=x;},onError:()=>{errors++;}});await flush();assert.equal(errors,1);fail=false;await f.tick();assert.equal(data,150);stop();
});
test('refreshes selectable defaults including cleared MRP without editing bill snapshots',()=>{
 const options=[{value:'A',mrpSticker:100,label:'Bed'}];const bill={product_id:'A',mrpSticker:90};assert.equal(refreshOptionPrices(options,[{value:'A',mrpSticker:120}])[0].mrpSticker,120);assert.equal(refreshOptionPrices(options,[{value:'A',mrpSticker:null}])[0].mrpSticker,null);assert.equal(options[0].mrpSticker,100);assert.equal(bill.mrpSticker,90);
});
