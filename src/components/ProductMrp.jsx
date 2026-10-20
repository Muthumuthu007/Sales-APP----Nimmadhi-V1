import React,{useContext} from 'react';
import {ProductMrpContext} from '../context/ProductMrpContext';
import {mappedMrp,mrpText} from '../utils/productMrp';
export default function ProductMrp({item,label=true}){
 const {prices,loading,error}=useContext(ProductMrpContext);const amount=mappedMrp(item,prices);
 return <span className="product-mrp" style={{display:'block',fontSize:'.8rem',whiteSpace:'normal',color:'var(--color-text-muted)'}}>{label?'MRP: ':''}{amount!==null?mrpText(amount):loading?'Loading…':error?'Unavailable':mrpText(null)}</span>;
}
