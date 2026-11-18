// Vehicle loads take precedence. Legacy records retain their saved plan identity.
export function dispatchGroups(rows=[]){
 const groups=new Map();
 rows.forEach((row,index)=>{
  const key=row.vehicleLoadId ? `load:${row.vehicleLoadId}` : row.loadPlanId ? `plan:${row.orderId || ''}:${row.loadPlanId}:${row.sourceLocationId || row.sourceType || ''}` : `record:${row.dispatchId || row.lineId || index}`;
  if(!groups.has(key))groups.set(key,{key,rows:[]});
  groups.get(key).rows.push(row);
 });
 return [...groups.values()];
}
export function dispatchGroupLabel(row={}){
 if(row.vehicleLoadId)return row.vehicleLoadNumber || `LOAD-${row.vehicleLoadId.slice(0,8).toUpperCase()}`;
 return row.planDisplayId || row.displayId || (row.loadPlanId ? `Plan ${row.loadPlanId.slice(0,8)}` : 'Legacy dispatch');
}
