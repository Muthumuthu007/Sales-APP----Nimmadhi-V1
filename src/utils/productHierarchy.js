export function productionOption(product) {
 return {mrpSticker:product.mrpSticker,value:product.productId || product.product_id,label:product.productName || product.product_name,
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

// Paths supply visual nesting only. Selection always retains the saved group ID.
export function orderGroupTree(categories) {
 return categories.map(main=>{
  const root={id:`main:${main.name}`,label:main.name,groups:[],children:[],count:0};
  for(const group of main.groups) {
   let parts=String(group.label || '').split('→').map(part=>part.trim()).filter(Boolean);
   if(parts[0]===main.name)parts=parts.slice(1);
   let node=root;
   for(const label of parts) {
    let child=node.children.find(item=>item.label===label);
    if(!child){child={id:`${node.id}/${label}`,label,groups:[],children:[],count:0};node.children.push(child);}
    node=child;
   }
   node.groups.push({...group,shortLabel:parts.at(-1) || main.name});
  }
  const count=node=>{node.count=node.groups.reduce((sum,group)=>sum+group.options.length,0)+node.children.reduce((sum,child)=>sum+count(child),0);return node.count;};
  count(root);return root;
 });
}
