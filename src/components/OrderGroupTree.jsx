import React,{useMemo} from 'react';
import {orderGroupTree} from '../utils/productHierarchy';
export default function OrderGroupTree({categories,selectedId,onSelect,search=''}) {
 const roots=useMemo(()=>orderGroupTree(categories),[categories]);
 const containsSelected=node=>node.groups.some(group=>group.id===selectedId) || node.children.some(containsSelected);
 const render=node=><div className="order-group-node" key={node.id}>
  {node.children.length ? <details open={Boolean(search.trim()) || containsSelected(node)}><summary><span>{node.label}</span><small>{node.count} products</small></summary><div className="order-group-children">{node.groups.map(button)}{node.children.map(render)}</div></details> : node.groups.map(button)}
 </div>;
 const button=group=><button type="button" key={group.id} className={`order-builder-group ${selectedId===group.id?'selected':''}`} onClick={()=>onSelect(group.id)}><span>{group.shortLabel}</span><small>{group.options.length}</small></button>;
 return <div className="order-group-tree">{roots.map(render)}</div>;
}
