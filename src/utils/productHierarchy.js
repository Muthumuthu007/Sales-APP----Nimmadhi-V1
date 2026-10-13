export function productionOption(product) {
 return {value:product.productId || product.product_id,label:product.productName || product.product_name,
  groupId:product.groupId || product.group_id,group:product.groupPath || product.groupName || product.group_name || 'Ungrouped',
  mainGroupName:product.mainGroupName || 'Needs classification',mainGroupId:product.mainGroupId,isAccessory:product.isAccessory};
}
export function groupedProductOptions(options) {
 const result=new Map();
 for(const option of options.filter(item=>item.value)){
  const main=option.mainGroupName || 'Needs classification';
  if(!result.has(main))result.set(main,new Map());
  const key=option.groupId || option.group || 'Ungrouped';
  const groups=result.get(main);
  if(!groups.has(key))groups.set(key,{id:key,label:option.group || 'Ungrouped',options:[]});
  groups.get(key).options.push(option);
 }
 const rank=name=>name==='Mattress'?0:name==='Accessories'?1:2;
 return [...result].sort(([a],[b])=>rank(a)-rank(b)||a.localeCompare(b)).map(([name,groups])=>({name,groups:[...groups.values()].sort((a,b)=>a.label.localeCompare(b.label))}));
}
