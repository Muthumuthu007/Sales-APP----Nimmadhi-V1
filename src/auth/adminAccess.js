export const adminModules = [
 ['DASHBOARD','Dashboard','/dashboard'],['SALES_RECORD','Sales Record','/sales-record'],['FACTORY_MANAGEMENT','Factory Management','/factory-management'],['PENDING_PAYMENTS','Pending Payments','/pending-payments'],['ORDERS','Orders','/orders'],['AFTER_SALES','After-sales','/after-sales'],
 ['CREATE_LOAD','Create Load','/create-load'],['LOAD_PLANS','Load Plans','/load-plans'],['DISPATCH_PLANS','Dispatch Plans','/dispatch-plans'],['DISPATCH','Dispatch','/dispatch'],
 ['SALARY','Salary','/salary'],['ATTENDANCE','Attendance','/attendance'],['OUTLET_DASHBOARD','Outlet Dashboard','/outlets/overview'],['OUTLETS','Outlets','/outlets'],
 ['COMBOS','Combos','/combos'],['COMPLIMENTARY_PRODUCTS','Complimentary Products','/complimentary-products'],['DISCOUNTS','Discounts','/discounts'],['EMPLOYEES','Employees','/employees'],['CREATE_USER','Create User','/create-user'],
];
export function canAccessModule(access,module) {return !access?.restricted || access.modules?.includes(module);}
export function canAccessAdminPath(access,path) {
 const match=adminModules.find(([, ,route])=>path.toLowerCase()===route || path.toLowerCase().startsWith(route+'/'));
 return !access?.restricted || Boolean(match && canAccessModule(access,match[0]));
}
export function firstAdminPath(access) {return adminModules.find(([module])=>canAccessModule(access,module))?.[2] || '/login';}
export function savedAdminAccess(storage) {try{return JSON.parse(storage.getItem('adminAccess') || 'null');}catch{return null;}}

export function isReadOnlyAdmin(access) {return Boolean(access?.restricted && access.accessMode==='READ_ONLY');}
export function isAdminReadRequest(method,url) {const verb=String(method || 'get').toUpperCase();const path=String(url || '').split('?')[0].replace(/\/$/,'');return ['GET','HEAD','OPTIONS'].includes(verb) || (verb==='POST' && ['/manager/employees/list','/outlet/employees/list'].includes(path));}
