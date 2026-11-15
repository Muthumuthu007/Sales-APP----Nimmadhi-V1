import React,{useContext} from 'react';
import {ProductMrpContext} from '../context/ProductMrpContext';
import {stockGroups} from '../utils/stockGroups';
import {orderGroupTree} from '../utils/productHierarchy';
export default function ProductListBlocks({items=[],renderItem,tableColumns,list=false}){
 const {catalogue=[]}=useContext(ProductMrpContext);
 const tree=orderGroupTree(stockGroups(items,catalogue));
 const render=(node,depth=0)=>{
  const body=<>{node.groups.flatMap(group=>group.options).map((option,index)=><React.Fragment key={index}>{renderItem(option.stock,items.indexOf(option.stock))}</React.Fragment>)}{node.children.map(child=>render(child,depth+1))}</>;
  if(tableColumns)return <React.Fragment key={node.id}><tr className="product-hierarchy-heading" data-pdf-ignore><th colSpan={tableColumns} scope="rowgroup" style={{paddingLeft:`${1+depth}rem`,textAlign:'left',color:'inherit',background:'rgba(127,127,127,.08)'}}>{node.label}</th></tr>{body}</React.Fragment>;
  if(list)return <React.Fragment key={node.id}><li role="presentation" style={{paddingLeft:`${depth}rem`,fontWeight:600}}>{node.label}</li>{body}</React.Fragment>;
  return <section key={node.id} style={{margin:'.5rem 0',paddingLeft:depth?'.65rem':0,borderLeft:depth?'2px solid var(--color-border)':undefined,whiteSpace:'normal'}}><strong style={{display:'block',fontSize:'.8rem',color:depth?'var(--color-text-muted)':'var(--color-primary)',marginBottom:'.35rem'}}>{node.label}</strong>{body}</section>;
 };

 if(tableColumns || list)return <>{tree.map(root=>render(root))}</>;
 return <div className="product-list-blocks" style={{minWidth:0}}>{tree.map(root=>render(root))}</div>;
}
