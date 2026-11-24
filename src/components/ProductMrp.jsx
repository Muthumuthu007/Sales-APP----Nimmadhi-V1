import React,{useContext} from 'react';
import {ProductMrpContext} from '../context/ProductMrpContext';
import {mappedMrp,mrpText} from '../utils/productMrp';
export default function ProductMrp({item,label=true}){
 const {prices,loading,error}=useContext(ProductMrpContext);const amount=mappedMrp(item,prices);
 return <span className="product-mrp" style={{display:'block',fontSize:'.8rem',whiteSpace:'normal',color:'var(--color-text-muted)'}}>{label?'MRP: ':''}{error?'Unavailable':loading?'Loading…':amount!==null?mrpText(amount):mrpText(null)}</span>;
}
