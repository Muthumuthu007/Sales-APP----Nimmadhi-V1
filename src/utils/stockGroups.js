import {groupedProductOptions} from './productHierarchy.js';

// Join current stock to the production catalogue by ID, never by product name.
export function stockGroups(rows, catalogue) {
 const products=new Map(catalogue.filter(p=>p.value).map(p=>[String(p.value),p]));
 const options=rows.map((row,index)=>{
  const id=row.productId || row.product_id;
  const product=products.get(String(id));
  return {...(product || {}),value:`stock-${index}`,stock:row,
   mainGroupName:product?.mainGroupName || row.mainGroupName || 'Needs classification',
   groupId:product?.groupId || row.groupId || row.group_id || 'UNCLASSIFIED',
   group:product?.group || row.groupPath || row.groupName || 'Unclassified products'};
 });
 return groupedProductOptions(options);
}
