import React from 'react';
import {Button} from './ui/Button';
import {showroomBillPrice} from '../utils/showroomPricing';
import {splitPayments} from '../utils/paymentSplits';
const money=value=>Number(value || 0).toLocaleString('en-IN',{style:'currency',currency:'INR'});
const modes={CASH:'Cash',UPI:'UPI',CARD:'Card',SPLIT:'Split payment'};
const Detail=({label,children})=><div><dt>{label}</dt><dd>{children || '—'}</dd></div>;
export default function SalesEntryReview({items,gross,cashDiscount,received,paymentMethod,split,customerName,customerPhone,customerAddress,date,details,salesPerson,onEdit}){
 const totalMrp=items.reduce((sum,item)=>sum+Math.round(Number(item.mrpSticker || 0)*100)*Number(item.quantity),0)/100;
 const bill=showroomBillPrice(gross.toFixed(2),cashDiscount);
 const payable=bill?.netBillAmount ?? 0;
 const parts=paymentMethod==='SPLIT'?splitPayments(split)?.payments || []:[];
 return <section className="sales-review-overview" aria-label="Complete bill review">
  <div className="sales-review-card"><header><h4>Customer</h4><Button variant="secondary" onClick={()=>onEdit(2)}>Edit customer</Button></header><dl>
   <Detail label="Customer name">{customerName}</Detail><Detail label="Phone number">{customerPhone}</Detail><Detail label="Delivery address">{customerAddress}</Detail>
  </dl></div>
  <div className="sales-review-card"><header><h4>Payment confirmation</h4><Button variant="secondary" onClick={()=>onEdit(1)}>Edit payment</Button></header><dl>
   <Detail label="Payment method"><strong className="sales-review-mode">{modes[paymentMethod] || 'Not selected'}</strong></Detail>
   {parts.map((part,index)=><Detail key={index} label={modes[part.paymentMethod]}>{money(part.amount)}</Detail>)}
   <Detail label="Amount received"><strong>{money(received)}</strong></Detail><Detail label="Balance to receive"><strong>{money(Math.max(0,payable-Number(received || 0)))}</strong></Detail>
  </dl></div>
  <div className="sales-review-card"><header><h4>Order details</h4><Button variant="secondary" onClick={()=>onEdit(1)}>Edit dates</Button></header><dl>
   <Detail label="Sale date">{date}</Detail><Detail label="Planned dispatch">{details.dispatchDate}</Detail><Detail label="Bill number">{details.billNo || 'Generated on submission'}</Detail><Detail label="Work order">Generated on submission</Detail><Detail label="Sales person">{salesPerson || 'Your login'}</Detail><Detail label="Total quantity">{String(items.reduce((sum,item)=>sum+Number(item.quantity),0))}</Detail>
  </dl></div>
  <div className="sales-review-card"><header><h4>Bill calculation</h4></header><dl>
   <Detail label="Total sticker MRP">{money(totalMrp)}</Detail><Detail label="Product discounts">− {money(totalMrp-gross)}</Detail><Detail label="After product discounts">{money(gross)}</Detail><Detail label="Cash discount">− {money(cashDiscount)}</Detail><Detail label="Round-off">{money(bill?.roundOff)}</Detail><Detail label="Grand total (tax included)"><strong>{money(payable)}</strong></Detail>
  </dl></div>
 </section>;
}
