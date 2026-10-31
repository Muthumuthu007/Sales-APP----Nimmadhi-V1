import test from 'node:test';import assert from 'node:assert/strict';
import {adminModules,canAccessAdminPath,canAccessModule,firstAdminPath} from './adminAccess.js';import {persistSession} from './session.js';
const restricted={restricted:true,modules:['ORDERS'],locations:['Chennai']};
test('orders-only admin sees only orders and starts there, including order details',()=>{
 assert.equal(firstAdminPath(restricted),'/orders');assert.equal(canAccessAdminPath(restricted,'/orders/ORDER1'),true);
 for(const [, ,path] of adminModules)assert.equal(canAccessAdminPath(restricted,path),path==='/orders');
 assert.equal(canAccessAdminPath(restricted,'/unknown'),false);
});
test('main admin retains all existing modules',()=>{
 for(const [module,,path] of adminModules){assert.equal(canAccessModule(null,module),true);assert.equal(canAccessAdminPath(null,path),true);}
 assert.equal(firstAdminPath(null),'/dashboard');
});
test('permissions are stored before navigation and cleared when another user signs in',()=>{
 const values=new Map();const storage={setItem:(key,value)=>values.set(key,String(value)),getItem:key=>values.get(key) || null,removeItem:key=>values.delete(key)};
 storage.setItem('managerLocationFilter','Madurai');
 persistSession(storage,{token:'scoped-token',role:'MANAGER',username:'orders-admin',adminAccess:restricted});
 assert.deepEqual(JSON.parse(storage.getItem('adminAccess')),restricted);assert.equal(storage.getItem('managerLocationFilter'),null);
 persistSession(storage,{token:'main-token',role:'MANAGER',username:'main'});assert.equal(storage.getItem('adminAccess'),null);
});

test('admin management is exclusive to the main admin even when all modules are granted',()=>{
 assert.equal(canAccessAdminPath(null,'/admin-management'),true);
 assert.equal(canAccessAdminPath({restricted:true,modules:adminModules.map(item=>item[0])},'/admin-management'),false);
});

test('Outlet Dashboard can be granted independently of outlet management',()=>{
 const dashboard={restricted:true,modules:['OUTLET_DASHBOARD']};
 assert.equal(firstAdminPath(dashboard),'/outlets/overview');
 assert.equal(canAccessAdminPath(dashboard,'/outlets/overview'),true);
 assert.equal(canAccessAdminPath(dashboard,'/outlets'),false);
 assert.equal(canAccessAdminPath({restricted:true,modules:['OUTLETS']},'/outlets/overview'),false);
 assert.ok(adminModules.some(([id,label])=>id==='OUTLET_DASHBOARD' && label==='Outlet Dashboard'));
});

test('every assignable manager menu destination has its own permission option',async()=>{
 const {readFile}=await import('node:fs/promises');
 const sidebar=await readFile(new URL('../components/ui/Sidebar.jsx',import.meta.url),'utf8');
 const menu=sidebar.match(/const managerLinks = \[([\s\S]*?)\n {2}\];/)[1];
 const routes=[...menu.matchAll(/to: '([^']+)'/g)].map(match=>match[1]).filter(route=>route!=='/admin-management');
 assert.deepEqual(new Set(adminModules.map(([, ,route])=>route)),new Set(routes));
});

test('payment-only admin sees payment module without factory dispatch access',()=>{
 const access={restricted:true,modules:['PENDING_PAYMENTS']};
 assert.equal(firstAdminPath(access),'/pending-payments');
 assert.equal(canAccessAdminPath(access,'/pending-payments'),true);
 assert.equal(canAccessAdminPath(access,'/factory-management'),false);
 assert.equal(canAccessAdminPath({restricted:true,modules:['FACTORY_MANAGEMENT']},'/pending-payments'),false);
});
test('combo dashboard has a separate assignable permission',()=>{
 const access={restricted:true,modules:['COMBOS'],locations:['Chennai']};
 assert.equal(firstAdminPath(access),'/combos');assert.equal(canAccessAdminPath(access,'/combos'),true);
 assert.equal(canAccessAdminPath(access,'/complimentary-products'),false);
 assert.equal(canAccessAdminPath({restricted:true,modules:['COMPLIMENTARY_PRODUCTS']},'/combos'),false);
});
