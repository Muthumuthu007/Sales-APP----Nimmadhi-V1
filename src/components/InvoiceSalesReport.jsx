import {saleProductName} from '../utils/saleProductName';
import React,{useMemo} from 'react';
import {Table} from './ui/Table';
import ProductMrp from './ProductMrp';
import {reportInvoices} from '../utils/reportInvoices';
const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(value || 0));
export default function InvoiceSalesReport({rows,complimentarySummary}) {
 const invoices=useMemo(()=>reportInvoices(rows),[rows]);
 return <Table columns={[
  {key:'number',label:'S.No',render:(_,i)=>i+1},
  {key:'invoice',label:'Invoice / Work order',render:r=><div><strong>{r.billNo || r.saleReferenceId || r.saleId || 'Not recorded'}</strong><br/>{r.workOrders.join(', ') || '—'}<br/>{r.saleTimestamp ? new Date(r.saleTimestamp).toLocaleDateString() : '—'}</div>},
  {key:'customerName',label:'Customer',render:r=><div><strong>{r.customerName || 'Not recorded'}</strong><br/>{r.customerPhone}<br/>{r.customerAddress}</div>},
  {key:'invoiceItems',label:'Products',render:r=><details><summary style={{cursor:'pointer',minHeight:'44px',padding:'.5rem 0'}}>View {r.items.length} product {r.items.length===1?'line':'lines'} · {r.quantity} units</summary><Table columns={[
   {key:'productName',label:'Product',render:item=>saleProductName(item.productName,item.size)},
   {key:'quantity',label:'Qty'},
   {key:'mrpSticker',label:'Sticker MRP',render:item=>item.mrpSticker!=null?money(item.mrpSticker):<ProductMrp item={item} label={false}/>},
   {key:'discountPercent',label:'Discount',render:item=>item.discountPercent==null?'—':`${item.discountPercent}%`},
   {key:'value',label:'Unit value',render:item=>money(item.value ?? item.price)},
   {key:'lineTotal',label:'Line total',render:item=>money(item.totalAmount)},
   {key:'specifications',label:'Specifications',render:item=>[item.brand,saleProductName(item.model,item.size),item.colour,item.size].filter(Boolean).join(' · ') || '—'},
   {key:'dispatchDate',label:'Planned dispatch'},
   {key:'scheme',label:'Scheme',render:item=>item.scheme || complimentarySummary(item.eligibleOffers)},
   {key:'taxPercent',label:'Included tax',render:item=>item.taxPercent==null?'—':`${item.taxPercent}%`},
  ]} data={r.items}/></details>},
  {key:'paymentMethod',label:'Payment method'},
  {key:'billAmount',label:'Invoice total',render:r=>money(r.billAmount)},
  {key:'advanceAmount',label:'Received',render:r=>money(r.advanceAmount)},
  {key:'balanceDue',label:'Pending',render:r=>money(r.balanceDue)},
  {key:'cashDiscount',label:'Invoice cash discount',render:r=>money(r.cashDiscount)},
  {key:'createdByName',label:'Sales person',render:r=>r.createdByName || 'Not recorded'},
 ]} data={invoices} emptyStateMessage="No invoices for this report."/>;
}
