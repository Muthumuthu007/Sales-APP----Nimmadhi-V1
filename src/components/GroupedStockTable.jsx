import React,{useMemo,useState} from 'react';
import {Table} from './ui/Table';
import {Input} from './ui/Input';
import {stockGroups} from '../utils/stockGroups';
import './GroupedStockTable.css';

export default function GroupedStockTable({data,columns,catalogue,emptyStateMessage}) {
 const [search,setSearch]=useState(''),[expanded,setExpanded]=useState(true),[revision,setRevision]=useState(0);
 const groups=useMemo(()=>stockGroups(data,catalogue),[data,catalogue]);
 const term=search.trim().toLowerCase();
 const visible=groups.map(main=>({...main,groups:main.groups.map(group=>({...group,options:group.options.filter(option=>[main.name,group.label,option.stock.productName,option.stock.productId,option.stock.product_id].join(' ').toLowerCase().includes(term))})).filter(group=>group.options.length)})).filter(main=>main.groups.length);
 return <div className="grouped-stock">
  <div className="grouped-stock-toolbar"><Input label="Search stock by product, group or subgroup" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search stock…"/><button type="button" onClick={()=>{setExpanded(!expanded);setRevision(v=>v+1);}}>{expanded?'Collapse all':'Expand all'}</button></div>
  {!visible.length && <p role="status">{term?'No stock matches your search.':emptyStateMessage}</p>}
  {visible.map(main=><details className="stock-main-group" key={`${main.name}-${revision}-${term}`} open={expanded || Boolean(term)}><summary>{main.name}<span>{main.groups.reduce((n,g)=>n+g.options.length,0)} products</span></summary>
   {main.groups.map(group=><details className="stock-subgroup" key={group.id} open={expanded || Boolean(term)}><summary>{group.label}<span>{group.options.length} products</span></summary><Table columns={columns} data={group.options.map(option=>option.stock)} emptyStateMessage={emptyStateMessage}/></details>)}
  </details>)}
 </div>;
}
