import {outletLocation,UNASSIGNED_LOCATION} from './locationScope.js';
export const locationId=outlet=>outlet.outletId || outlet.id;
export function employeeOutlets(outlets,location='',outletId=''){
 return outlets.filter(outlet=>(!outletId || locationId(outlet)===outletId) && (!location || (location===UNASSIGNED_LOCATION?!outletLocation(outlet):outletLocation(outlet).toLocaleLowerCase()===location)));
}
export function employeeAtOutlet(employee,outlet){return {...employee,outletId:locationId(outlet),outletName:outlet.outletName || outlet.name || locationId(outlet),locationName:outletLocation(outlet) || 'Unassigned'};}
export async function mapEmployeeLocations(outlets,read,concurrency=4){
 const results=new Array(outlets.length);let next=0;
 await Promise.all(Array.from({length:Math.min(concurrency,outlets.length)},async()=>{while(next<outlets.length){const index=next++;results[index]=await read(outlets[index]);}}));
 return results;
}
export function combineEmployeeIncentives(reports){
 const sales={incentivePool:0,matchedQuantity:0,unmatchedQuantity:0,unmatchedProducts:[]};let eligiblePresentDays=0;
 for(const report of reports){for(const field of ['incentivePool','matchedQuantity','unmatchedQuantity'])sales[field]+=Number(report?.sales?.[field] || 0);sales.unmatchedProducts.push(...(report?.sales?.unmatchedProducts || []));eligiblePresentDays+=Number(report?.attendance?.eligiblePresentDays || 0);}
 return {sales,attendance:{eligiblePresentDays}};
}
