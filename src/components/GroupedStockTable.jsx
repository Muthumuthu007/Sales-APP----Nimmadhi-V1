import React,{useContext,useMemo,useState} from 'react';
import {Table} from './ui/Table';
import {Input} from './ui/Input';
import {stockGroups} from '../utils/stockGroups';
import {orderGroupTree} from '../utils/productHierarchy';
import {ProductMrpContext} from '../context/ProductMrpContext';
import './GroupedStockTable.css';
export default function GroupedStockTable({data,columns,catalogue,emptyStateMessage,onRowClick,className}){
 const {catalogue:shared=[]}=useContext(ProductMrpContext);
 const [search,setSearch]=useState(''),[expanded,setExpanded]=useState(true),[revision,setRevision]=useState(0);
 const groups=useMemo(()=>stockGroups(data,catalogue || shared),[data,catalogue,shared]);
 const term=search.trim().toLowerCase();
 const visible=groups.map(main=>({...main,groups:main.groups.map(group=>({...group,options:group.options.filter(option=>[main.name,group.label,option.stock.productName,option.stock.product_name,option.stock.productId,option.stock.product_id].join(' ').toLowerCase().includes(term))})).filter(group=>group.options.length)})).filter(main=>main.groups.length);
 const render=(node,depth=0)=><details className={depth?'stock-subgroup':'stock-main-group'} key={`${node.id}-${revision}-${term}`} open={expanded || Boolean(term)}><summary>{node.label}<span>{node.count} products</span></summary>{node.groups.map(group=><Table key={group.id} hierarchy={false} onRowClick={onRowClick} className={className} columns={columns} data={group.options.map(option=>option.stock)} emptyStateMessage={emptyStateMessage}/>)}{node.children.map(child=>render(child,depth+1))}</details>;
 return <div className="grouped-stock"><div className="grouped-stock-toolbar"><Input label="Search products, groups or subgroups" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search products…"/><button type="button" onClick={()=>{setExpanded(!expanded);setRevision(v=>v+1);}}>{expanded?'Collapse all':'Expand all'}</button></div>{!visible.length&&<p role="status">{term?'No products match your search.':emptyStateMessage}</p>}{orderGroupTree(visible).map(root=>render(root))}</div>;
}
