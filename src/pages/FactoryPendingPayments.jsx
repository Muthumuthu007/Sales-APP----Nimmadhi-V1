import PaymentBreakdown from '../components/PaymentBreakdown';
import PaymentSplitInput from '../components/PaymentSplitInput';
import {splitPayments,paymentDescription} from '../utils/paymentSplits';
import {idempotentPost} from '../api/idempotent';
import React,{useCallback,useEffect,useState} from 'react';
import api from '../api/axios';
import {Card,CardHeader,CardContent} from '../components/ui/Card';
import {Button} from '../components/ui/Button';
import {Input,Select} from '../components/ui/Input';
import {Table} from '../components/ui/Table';
import {Modal} from '../components/ui/Modal';
import {LoadingState,ErrorState} from '../components/ui/StateContainers';
import {outletLabel} from '../utils/outlets';
const money=value=>Number(value || 0).toLocaleString('en-IN',{style:'currency',currency:'INR'});
export default function FactoryPendingPayments({readOnly=false}){
 const [splits,setSplits]=useState({});
 const [outlets,setOutlets]=useState([]),[outlet,setOutlet]=useState(''),[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [target,setTarget]=useState(null),[amount,setAmount]=useState(''),[method,setMethod]=useState('CASH'),[saving,setSaving]=useState(false),[paymentError,setPaymentError]=useState(''),[message,setMessage]=useState(''),[receipt,setReceipt]=useState(null);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const catalogue=await api.get('/outlets');
   const own=(catalogue.outlets || []).filter(item=>String(item.outletId).toUpperCase().startsWith('NIM'));setOutlets(own);
   const selected=outlet?own.filter(item=>item.outletId===outlet):own;
   const invoices=await Promise.all(selected.map(async item=>{const data=await api.get('/manager/factory-management/payments',{params:{outletId:item.outletId}});return (data.customers || []).map(invoice=>({...invoice,outletId:item.outletId}));}));
   setRows(invoices.flat());
  }catch(err){setError(err.response?.data?.error || 'Unable to load pending payments.');setRows([]);}
  finally{setLoading(false);}
 },[outlet]);
 useEffect(()=>{load();},[load]);
 const settle=async()=>{
  if(readOnly)return;
  const paidAmount=Number(amount);
  if(method==='SPLIT' && (!splitPayments(splits)?.payments.length || splitPayments(splits).total!==paidAmount)){setPaymentError('Enter valid split amounts equal to the payment received.');return;}
  if(!Number.isFinite(paidAmount)||paidAmount<=0||paidAmount>Number(target.balanceDue)){setPaymentError('Enter an amount greater than zero and no more than the balance due.');return;}
  setSaving(true);setPaymentError('');
  try{const result=await idempotentPost(api, `/manager/factory-management/payments/${encodeURIComponent(target.saleReferenceId)}/payment`,{outletId:target.outletId,paidAmount,paymentMethod:method,...(method==='SPLIT'?{payments:splitPayments(splits).payments}:{})});setReceipt(result);setMessage(`Payment recorded for ${result.saleReferenceId}. Remaining balance: ${money(result.balanceDue)}.`);setTarget(null);await load();}
  catch(err){setPaymentError(err.response?.data?.error || 'Unable to record payment.');}
  finally{setSaving(false);}
 };
 const columns=[{key:'outletId',label:'Own outlet',render:row=>outletLabel(row.outletId,outlets)},{key:'saleReferenceId',label:'Invoice'},{key:'customerName',label:'Customer',render:row=><><strong>{row.customerName}</strong><br/>{row.customerPhone}<br/>{row.customerAddress}</>},{key:'products',label:'Products',render:row=>(row.products || []).map((item,index)=><div key={`${item.productId}-${index}`} title={item.productName}>{item.productName} × {item.quantity}</div>)},{key:'saleDate',label:'Invoice date'},{key:'billAmount',label:'Bill',render:row=>money(row.billAmount)},{key:'advanceAmount',label:'Paid',render:row=><>{money(row.advanceAmount)}<PaymentBreakdown amounts={row.paymentBreakdown}/></>},{key:'balanceDue',label:'Balance due',render:row=><strong>{money(row.balanceDue)}</strong>},...(!readOnly?[{key:'action',label:'Action',render:row=><Button onClick={()=>{setTarget(row);setAmount(String(row.balanceDue));setMethod('CASH');setSplits({});setPaymentError('');}}>Record payment</Button>}]:[])];
 return <Card><CardHeader title="Pending customer payments" action={<Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>}/><CardContent>
 <p>{readOnly?'View customer balances here. Record payments from the Pending Payments module.':'Record customer balance payments for own NIM outlets. Fully paid invoices leave this list.'}</p>
 <Select label="Own outlet" value={outlet} onChange={event=>setOutlet(event.target.value)} options={[{value:'',label:'All own outlets'},...outlets.map(item=>({value:item.outletId,label:outletLabel(item.outletId,outlets)}))]}/>
 {message&&<p role="status">{message}</p>}
 {loading?<LoadingState message="Loading pending payments…"/>:error?<ErrorState error={error} onRetry={load}/>:<Table columns={columns} data={rows} emptyStateMessage="No pending customer payments."/>}
 <Modal isOpen={!readOnly && Boolean(target)} onClose={()=>!saving&&setTarget(null)} title="Record customer payment">{target&&<div style={{display:'grid',gap:'1rem'}}><strong>{target.customerName} · {target.saleReferenceId}</strong><p>Balance due: {money(target.balanceDue)}</p><Select label="Payment method" value={method} onChange={e=>setMethod(e.target.value)} options={['CASH','CARD','UPI','SPLIT'].map(value=>({value,label:value}))}/>{method==='SPLIT' && <PaymentSplitInput values={splits} onChange={setSplits} onTotalChange={setAmount} disabled={saving}/>}<Input readOnly={method==='SPLIT'} label="Amount paid now" type="number" min="0.01" max={target.balanceDue} step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/>{paymentError&&<p role="alert">{paymentError}</p>}<Button disabled={saving} onClick={settle}>{saving?'Saving…':'Confirm payment'}</Button><Button variant="secondary" disabled={saving} onClick={()=>setTarget(null)}>Cancel</Button></div>}</Modal>
 <Modal isOpen={!readOnly && Boolean(receipt)} onClose={()=>setReceipt(null)} title="Customer payment receipt">{receipt&&<article className="sales-receipt"><header><h2>NIMMADHI MATTRESS</h2><strong>{receipt.saleReferenceId}</strong></header><p>{receipt.customerName}<br/>{receipt.customerPhone}<br/>{receipt.customerAddress}</p>{(receipt.items || []).map(item=><p key={item.product_id}>{item.productName} × {item.quantity}</p>)}<p>Total bill: {money(receipt.billAmount)}<br/>Payment received now: {money(receipt.paidNow)} ({receipt.payments?paymentDescription(receipt.payments):receipt.paymentMethod})<br/>Total paid: {money(receipt.advanceAmount)}<br/><strong>Balance due: {money(receipt.balanceDue)}</strong></p><div className="sales-receipt-actions"><Button onClick={()=>window.print()}>Print receipt</Button><Button variant="secondary" onClick={()=>{const digits=String(receipt.customerPhone || '').replace(/\D/g,'');if(!digits)return;const text=`Nimmadhi Mattress — Invoice ${receipt.saleReferenceId}\nCustomer: ${receipt.customerName}\nBill: ${money(receipt.billAmount)}\nPayment received: ${money(receipt.paidNow)}\nTotal paid: ${money(receipt.advanceAmount)}\nBalance due: ${money(receipt.balanceDue)}`;window.open(`https://wa.me/${digits.length===10?'91'+digits:digits}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');}}>Share receipt</Button></div></article>}</Modal>
 </CardContent></Card>;
}
