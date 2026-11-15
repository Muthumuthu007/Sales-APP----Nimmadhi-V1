export function productionOption(product) {
 return {taxPercent:product.taxPercent,taxSettingsVersion:product.taxSettingsVersion,mrpSticker:product.mrpSticker,value:product.productId || product.product_id,label:product.productName || product.product_name,
  groupId:product.groupId || product.group_id,group:product.groupPath || product.groupName || product.group_name || 'Ungrouped',
  mainGroupName:product.mainGroupName || 'Needs classification',mainGroupId:product.mainGroupId,groupAncestors:product.groupAncestors,isAccessory:product.isAccessory};
}
export function groupedProductOptions(options) {
 const result=new Map();
 for(const option of options.filter(item=>item.value)){
  const main=option.mainGroupName || 'Needs classification';
  if(!result.has(main))result.set(main,new Map());
  const key=option.groupId || option.group || 'Ungrouped';
  const groups=result.get(main);
  if(!groups.has(key))groups.set(key,{id:key,label:option.group || 'Ungrouped',ancestors:option.groupAncestors,options:[]});
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
   let parts=group.ancestors?.length
    ? group.ancestors.map(part=>({id:part.id,label:part.name}))
    : String(group.label || '').split('→').map(part=>part.trim()).filter(Boolean).map(label=>({label}));
   if(parts[0]?.label===main.name)parts=parts.slice(1);
   let node=root;
   for(const part of parts) {
    const id=part.id || `${node.id}/${part.label}`;
    let child=node.children.find(item=>item.id===id);
    if(!child){child={id,label:part.label,groups:[],children:[],count:0};node.children.push(child);}
    node=child;
   }
   node.groups.push({...group,shortLabel:parts.at(-1)?.label || main.name});
  }
  const count=node=>{node.count=node.groups.reduce((sum,group)=>sum+group.options.length,0)+node.children.reduce((sum,child)=>sum+count(child),0);return node.count;};
  count(root);return root;
 });
}

export function enrichProductOptions(options,catalogue=[]){
 const byId=new Map(catalogue.map(product=>[String(product.value),product]));
 return options.map(option=>{
  const product=byId.get(String(option.productId || option.product_id || option.value)) || byId.get(String(option.baseProductId || ''));
  if(!product)return option;
  return {...product,...option,groupId:option.groupAncestors?.length?option.groupId:(product.groupId || option.groupId),group:option.groupAncestors?.length?option.group:product.group,mainGroupName:option.groupAncestors?.length?option.mainGroupName:product.mainGroupName,groupAncestors:option.groupAncestors?.length?option.groupAncestors:product.groupAncestors};
 });
}
export function productListEntries(options){
 const result=[];
 const visit=(node,depth)=>{result.push({kind:'group',id:node.id,label:node.label,depth});for(const group of node.groups)for(const option of group.options)result.push({kind:'product',option,depth:depth+1});for(const child of node.children)visit(child,depth+1);};
 for(const root of orderGroupTree(groupedProductOptions(options)))visit(root,0);
 return result;
}
