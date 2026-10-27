export const adminModules = [
 ['DASHBOARD','Dashboard','/dashboard'],['FACTORY_MANAGEMENT','Factory Management','/factory-management'],['ORDERS','Orders','/orders'],['AFTER_SALES','After-sales','/after-sales'],
 ['LOAD_PLANS','Load Plans','/load-plans'],['DISPATCH_PLANS','Dispatch Plans','/dispatch-plans'],['DISPATCH','Dispatch','/dispatch'],
 ['SALARY','Salary','/salary'],['ATTENDANCE','Attendance','/attendance'],['OUTLET_DASHBOARD','Outlet Dashboard','/outlets/overview'],['OUTLETS','Outlets','/outlets'],
 ['COMPLIMENTARY_PRODUCTS','Complimentary Products','/complimentary-products'],['DISCOUNTS','Discounts','/discounts'],['EMPLOYEES','Employees','/employees'],['CREATE_USER','Create User','/create-user'],
];
export function canAccessModule(access,module) {return !access?.restricted || access.modules?.includes(module);}
export function canAccessAdminPath(access,path) {
 const match=adminModules.find(([, ,route])=>path.toLowerCase()===route || path.toLowerCase().startsWith(route+'/'));
 return !access?.restricted || Boolean(match && canAccessModule(access,match[0]));
}
export function firstAdminPath(access) {return adminModules.find(([module])=>canAccessModule(access,module))?.[2] || '/login';}
export function savedAdminAccess(storage) {try{return JSON.parse(storage.getItem('adminAccess') || 'null');}catch{return null;}}
