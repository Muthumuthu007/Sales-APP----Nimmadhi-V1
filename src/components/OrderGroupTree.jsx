import React,{useMemo} from 'react';
import {orderGroupTree} from '../utils/productHierarchy';
export default function OrderGroupTree({categories,selectedId,selectedProductId,onSelect,onSelectProduct,search=''}) {
 const roots=useMemo(()=>orderGroupTree(categories),[categories]);
 const containsSelected=node=>node.groups.some(group=>group.id===selectedId) || node.children.some(containsSelected);
 const products=group=><div className="order-tree-products" key={group.id}>{[...group.options].sort((a,b)=>a.label.localeCompare(b.label,undefined,{numeric:true})).map(product=><button type="button" key={product.value} className={`order-tree-product ${selectedProductId===product.value&&selectedId===group.id?'selected':''}`} aria-pressed={selectedProductId===product.value&&selectedId===group.id} onClick={()=>onSelectProduct?.(group.id,product.value)}><span>{product.label}</span>{product.mrpSticker!=null&&<small>MRP ₹{Number(product.mrpSticker).toLocaleString('en-IN')}</small>}</button>)}</div>;
 const render=(node,depth=0)=><div className="order-group-node" key={node.id}>
  <details open={Boolean(search.trim()) || containsSelected(node) || depth===0}>
   <summary onClick={()=>{if(node.groups.length===1)onSelect(node.groups[0].id);}}><span>{node.label}</span><small>{node.count} products</small></summary>
   <div className="order-group-children">{node.groups.map(products)}{node.children.map(child=>render(child,depth+1))}</div>
  </details>
 </div>;
 return <div className="order-group-tree" aria-label="Product groups and products">{roots.map(root=>render(root))}</div>;
}
