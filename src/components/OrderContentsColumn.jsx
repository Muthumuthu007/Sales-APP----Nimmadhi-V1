import React from 'react';
import OrderProduct from './OrderProduct';
import {orderContents,itemQuantity,complimentaryQuantitySummary} from '../utils/orderContents';
import './OrderContentsColumn.css';
export function ComplimentaryFor({item}){
 const parents=item.complimentaryFor?.length?item.complimentaryFor:item.parentProductId?[{productId:item.parentProductId,productName:item.parentProductName || item.parentProductId}]:[];
 return <small className="order-complimentary-for">{parents.length?`Complimentary for: ${parents.map(parent=>parent.productName || parent.productId).join('; ')}`:'Complimentary — original product link was not recorded.'}</small>;
}
export default function OrderContentsColumn({items=[],complimentary=false,receipt=false}){
 const result=orderContents(items),rows=complimentary?result.complimentary:result.products,summary=complimentaryQuantitySummary(result);
 return <div className="order-contents-column">
 {!rows.length?<span className="order-contents-empty">{complimentary?'No complimentary products.':'No ordered products in this entry.'}</span>:rows.map((row,index)=><div className="order-contents-item" key={`${row.product_id || row.productId || 'item'}-${index}`}><OrderProduct item={row} hideComplimentary/>{complimentary&&<ComplimentaryFor item={row}/>}<strong>{row.isOfferEstimate?'Offered quantity':'Quantity'}: {itemQuantity(row) ?? 'Not recorded'}</strong>{row.isOfferEstimate&&<small>Offer estimate · not allocated yet.</small>}{['approvedQty','pendingQty','dispatchedQty','receivedQty'].some(key=>row[key]!==undefined)&&<small>{[['approvedQty','Approved'],['pendingQty','Approval pending'],['dispatchedQty','Dispatched'],['receivedQty','Received']].filter(([key])=>row[key]!==undefined).map(([key,label])=>`${label}: ${row[key]}`).join(' · ')}</small>}{row.remainingQty!==undefined&&<small>Awaiting receipt: {row.remainingQty}</small>}</div>)}
 <div className="order-contents-total"><strong>{receipt?'Total awaiting receipt':complimentary?summary.label:'Total ordered quantity'}: {receipt?rows.reduce((sum,row)=>sum+Number(row.remainingQty || 0),0):complimentary?summary.quantity:result.productTotal}</strong>{complimentary&&result.unknownQuantities>0&&<small>{result.unknownQuantities} quantities need review; this total includes recorded quantities only.</small>}{complimentary&&summary.note&&<small>{summary.note}</small>}</div>
 </div>;
}
export function OrderContentsColumns({items=[],renderItem,receipt=false}){
 const result=orderContents(items);
 return <div className="order-contents-columns">{[[false,'Products ordered',result.products],[true,'Complimentary products',result.complimentary]].map(([free,title,rows])=><section key={title}><h4>{title}</h4>{renderItem?<div className="order-contents-column">{rows.length?rows.map((item,index)=><div className="order-contents-item" key={`${item.product_id || item.productId}-${index}`}>{renderItem(item,index)}{free&&<ComplimentaryFor item={item}/>}</div>):<span>None in this delivery.</span>}<div className="order-contents-total"><strong>{receipt?'Total awaiting receipt':'Total quantity'}: {rows.reduce((sum,row)=>sum+(receipt?Number(row.remainingQty || 0):itemQuantity(row) || 0),0)}</strong></div></div>:<OrderContentsColumn items={items} complimentary={free} receipt={receipt}/>}</section>)}</div>;
}
