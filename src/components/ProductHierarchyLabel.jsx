import React,{useContext} from 'react';
import {ProductMrpContext} from '../context/ProductMrpContext';
export default function ProductHierarchyLabel({item,children}){
 const {catalogue=[]}=useContext(ProductMrpContext);
 const product=catalogue.find(p=>String(p.value)===String(item?.productId || item?.product_id || item?.value)) || catalogue.find(p=>String(p.value)===String(item?.baseProductId || item?.base_product_id));
 const path=item?.groupPath || product?.group || 'Needs classification';
 return <span style={{display:'block',whiteSpace:'normal'}}><small style={{display:'block',color:'var(--color-text-muted)',fontSize:'.75rem',marginBottom:'.25rem'}}>{path}</small>{children}</span>;
}
