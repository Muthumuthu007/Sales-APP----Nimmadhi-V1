import PaymentBreakdown from './PaymentBreakdown';
import {saleProductName} from '../utils/saleProductName';
import React from 'react';
import {Button} from './ui/Button';
import './SalesBill.css';
const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(value || 0));
const date=value=>value?new Date(value.includes('T')?value:`${value}T12:00:00`).toLocaleDateString('en-IN'):'—';
export default function SalesBill({receipt,onSend,offerSummary}) {
 const items=receipt.items || [];
 const priced=receipt.pricingMode==='MRP_DISCOUNT';
 const mrp=priced?items.reduce((sum,item)=>sum+Number(item.mrpSticker || 0)*Number(item.quantity || 0),0):null;
 const gross=Number(receipt.grossBillAmount ?? receipt.billAmount ?? 0);
 const productDiscount=mrp==null?null:Math.max(0,mrp-gross);
 return <article className="paper-sales-bill">
  <header className="paper-bill-header"><div><h2>NIMMADHI MATTRESS</h2><p>Customer order &amp; payment receipt</p></div><div>No. <strong>{receipt.billNo || receipt.workOrderNo || receipt.factoryOrderDisplayId || receipt.saleReferenceId || '—'}</strong></div></header>
  <div className="paper-bill-top">
   <section><h3>Order details</h3><dl><dt>Date of order</dt><dd>{date(receipt.saleDate)}</dd><dt>Expected delivery</dt><dd>{date(receipt.dispatchDate)}</dd><dt>Work order</dt><dd>{receipt.workOrderNo || receipt.factoryOrderDisplayId || '—'}</dd><dt>Sales person</dt><dd>{receipt.createdByName || '—'}</dd></dl></section>
   <section><h3>Customer information</h3><dl><dt>Customer name</dt><dd>{receipt.customerName || '—'}</dd><dt>Delivery address</dt><dd>{receipt.customerAddress || '—'}</dd><dt>Primary phone</dt><dd>{receipt.customerPhone || '—'}</dd><dt>Additional phone</dt><dd>{receipt.alternatePhone || '—'}</dd></dl></section>
  </div>
  <section><h3>Product specifications</h3><table className="paper-bill-products"><thead><tr><th>Mattress size (L × W × T)</th><th>Mattress variant / Model</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{items.map((item,index)=><tr key={index}><td>{item.size || item.productName?.match(/\d+(?:\.\d+)?[xX×]\d+(?:\.\d+)?(?:[xX×]\d+(?:\.\d+)?)?/)?.[0] || '—'}</td><td><strong>{saleProductName(item.productName || item.model || item.product_id,item.size)}</strong>{item.brand && <div>{item.brand}{item.colour?` · ${item.colour}`:''}</div>}{priced && <div>MRP: {money(item.mrpSticker)} · Discount: {item.discountPercent}%</div>}{item.fulfillmentMode && <div>Delivery: {item.fulfillmentMode==='LOCAL_STOCK'?'Outlet stock':'Factory'}</div>}</td><td>{item.quantity}</td><td>{item.netSalesValue!=null || item.totalAmount!=null || item.totalSalesValue!=null ? money(item.netSalesValue ?? item.totalAmount ?? item.totalSalesValue) : '—'}</td></tr>)}</tbody></table></section>
  <section><h3>Billing summary</h3><div className="paper-bill-summary"><dl><dt>Total MRP</dt><dd>{mrp==null?'—':money(mrp)}</dd><dt>Product discount</dt><dd>{productDiscount==null?'—':money(productDiscount)}</dd><dt>{priced?'Cash discount':'Extra discount'}</dt><dd>{money(receipt.extraDiscountAmount ?? receipt.cashDiscount)}</dd>{priced && <><dt>Tax included</dt><dd>{money(items.reduce((sum,item)=>sum+Number(item.taxAmount || 0),0))}</dd></>}</dl><dl>{receipt.roundOff != null && <><dt>Round-off adjustment</dt><dd>{Number(receipt.roundOff)>0?'+':''}{money(receipt.roundOff)}</dd></>}<dt>Net payable amount</dt><dd><strong>{money(receipt.billAmount)}</strong></dd><dt>Amount received</dt><dd>{money(receipt.advanceAmount)}</dd><dt>Balance due</dt><dd><strong>{money(receipt.balanceDue)}</strong></dd></dl></div></section>
  <section><h3>Payment mode</h3><PaymentBreakdown amounts={receipt.paymentBreakdown}/><div className="paper-bill-payment">{['CASH','UPI','CARD'].map(method=><span key={method}>{receipt.paymentMethod===method || Number(receipt.paymentBreakdown?.[method])>0?'☑':'☐'} {method==='CASH'?'Cash':method==='CARD'?'Card':'UPI'}{receipt.paymentBreakdown?.[method]!=null?`: ${money(receipt.paymentBreakdown[method])}`:''}</span>)}</div></section>
  <section><h3>Compliments &amp; freebies</h3>{items.some(item=>item.scheme) && <p>{items.filter(item=>item.scheme).map(item=>item.scheme).join('; ')}</p>}{(receipt.eligibleOffers || []).filter(offer=>Number(offer.freeQuantity)>0).map((offer,i)=><p key={i}>{offerSummary(offer)}</p>)}{!items.some(item=>item.scheme) && !(receipt.eligibleOffers || []).some(offer=>Number(offer.freeQuantity)>0) && <p>None</p>}</section>
  <section><h3>Authorization</h3><p>Special instructions: {receipt.specialInstructions || '—'}</p><div className="paper-bill-signatures"><span>Showroom staff signature</span><span>Customer signature</span></div></section>
  <footer>Please ensure all details are correct. Retain this receipt for your records.<br/>Reference: {receipt.saleReferenceId || '—'}</footer>
  <div className="paper-bill-actions"><Button variant="secondary" onClick={()=>window.print()}>Print bill / Save PDF</Button>{receipt.customerPhone && <Button onClick={onSend}>Send receipt</Button>}</div>
 </article>;
}
