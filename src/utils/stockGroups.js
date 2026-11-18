import {groupedProductOptions} from './productHierarchy.js';

// Join current stock to the production catalogue by ID, never by product name.
export function stockGroups(rows, catalogue) {
 const products=new Map(catalogue.filter(p=>p.value).map(p=>[String(p.value),p]));
 const options=rows.map((row,index)=>{
  const id=row.productId || row.product_id || row.freeProductId || row.value;
  const baseId=row.baseProductId || row.base_product_id;
  const product=baseId ? products.get(String(baseId)) : products.get(String(id));
  const savedHierarchy=Boolean(baseId && row.groupId && row.groupAncestors?.length && row.mainGroupName && row.mainGroupName!=='Needs classification');
  const hierarchy=savedHierarchy?{mainGroupName:row.mainGroupName,groupAncestors:row.groupAncestors,groupId:row.groupId,group:row.groupPath || row.groupName}:product;
  return {...(product || {}),value:`stock-${index}`,stock:row,
   mainGroupName:hierarchy?.mainGroupName || row.mainGroupName || 'Needs classification',
   groupAncestors:hierarchy?.groupAncestors || row.groupAncestors,
   groupId:hierarchy?.groupId || row.groupId || row.group_id || 'UNCLASSIFIED',
   group:hierarchy?.group || row.groupPath || row.groupName || 'Unclassified products'};
 });
 return groupedProductOptions(options);
}
