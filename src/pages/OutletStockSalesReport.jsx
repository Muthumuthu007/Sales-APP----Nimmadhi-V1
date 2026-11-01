import React,{useEffect,useMemo,useState} from 'react';
import api from '../api/axios';
import {businessDate} from '../utils/businessDate';
import {Card,CardHeader,CardContent} from '../components/ui/Card';
import {Input} from '../components/ui/Input';
import {Button} from '../components/ui/Button';
import GroupedStockTable from '../components/GroupedStockTable';
export default function OutletStockSalesReport({outletId,catalogue,onBack}){
 const [start,setStart]=useState(businessDate),[end,setEnd]=useState(businessDate),[reload,setReload]=useState(0),[snapshot,setSnapshot]=useState({key:'',data:null,error:''});
 const key=`${outletId}:${start}:${end}:${reload}`,loading=snapshot.key!==key;
 const invalid=!start || !end || start>end;
 const data=loading?null:snapshot.data,error=loading?'':snapshot.error;
 useEffect(()=>{if(!start || !end || start>end)return;let active=true;api.get('/reports/outlet-stock-sales',{params:{outletId,startDate:start,endDate:end}}).then(data=>{if(active)setSnapshot({key,data,error:''});}).catch(err=>{if(active)setSnapshot({key,data:null,error:err.response?.data?.error || 'Unable to load outlet-stock sales. Please retry.'});});return()=>{active=false;};},[outletId,start,end,key]);
 const products=useMemo(()=>{
  const grouped=new Map();
  for(const line of data?.lines || []){
   const id=JSON.stringify([line.productId,line.productName,line.colour || '',line.size || '']);
   if(!grouped.has(id))grouped.set(id,{...line,quantity:0,invoices:new Set(),details:[]});
   const row=grouped.get(id);row.quantity+=Number(line.quantity);row.invoices.add(`${line.outletId}:${line.saleReferenceId || line.saleId}`);row.details.push(line);
  }
  return [...grouped.values()].sort((a,b)=>a.productName.localeCompare(b.productName));
 },[data]);
 const columns=[{key:'productName',label:'Product'},{key:'size',label:'Size'},{key:'colour',label:'Colour'},{key:'quantity',label:'Units supplied'},{key:'invoices',label:'Bills',render:row=>row.invoices.size},{key:'details',label:'Bill / customer details',render:row=><details><summary>View {row.invoices.size} bill(s)</summary>{row.details.map((line,i)=><p key={`${line.saleId}-${i}`}><strong>{line.workOrderNo || line.billNo || line.saleReferenceId || line.saleId}</strong> · {line.saleDate}<br/>{line.customerName || '—'} · {line.customerPhone || '—'}<br/>{line.customerAddress || '—'}<br/>{line.quantity} unit(s){line.stallId&&` · Stall: ${line.stallId}`}</p>)}</details>}];
 const download=()=>{
  const cell=value=>'"'+String(value ?? '').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
  const rows=[['Outlet',outletId],['Sale dates',start,end],['Main group','Subgroup','Product','Size','Colour','Quantity supplied','Work order','Bill','Sale date','Customer','Phone','Address','Sale outlet','Stall'],...(data?.lines || []).map(r=>[r.mainGroupName,r.groupPath,r.productName,r.size,r.colour,r.quantity,r.workOrderNo,r.billNo || r.saleReferenceId,r.saleDate,r.customerName,r.customerPhone,r.customerAddress,r.outletId,r.stallId])];
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`paid-outlet-stock-sales-${outletId}-${start}-${end}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
 };
 return <Card><CardHeader title="Fully Paid Outlet-stock Sales" action={<Button variant="secondary" onClick={onBack}>Back to reports</Button>}/><CardContent>
 <div style={{display:'flex',flexWrap:'wrap',gap:'1rem',alignItems:'end'}}><Input label="Sale date from" type="date" value={start} max={end || businessDate()} onChange={e=>setStart(e.target.value)}/><Input label="Sale date to" type="date" value={end} min={start} max={businessDate()} onChange={e=>setEnd(e.target.value)}/><Button variant="secondary" disabled={invalid || loading} onClick={()=>setReload(v=>v+1)}>Refresh report</Button><Button disabled={invalid || loading || Boolean(error) || !products.length} onClick={download}>Download CSV</Button></div>
 <p>Fully paid bills supplied from this outlet’s stock, grouped by product hierarchy. Factory deliveries and pending payments are excluded. Dates refer to the sale date; payment status is current.</p>
 <p>Own-outlet local sales are supplied when saved. For linked-stall deliveries and separately tracked dispatches, only the quantity marked dispatched is included.</p>
 {invalid?<p role="alert">Choose a valid date range.</p>:loading?<p role="status">Loading outlet-stock sales…</p>:error?<p role="alert">{error}</p>:<><div style={{display:'flex',flexWrap:'wrap',gap:'1.5rem',padding:'1rem 0'}}><span><strong>{products.length}</strong> products / variants</span><span><strong>{data?.totalQuantity || 0}</strong> units supplied</span><span><strong>{data?.totalInvoices || 0}</strong> fully paid bills</span></div><GroupedStockTable data={products} columns={columns} catalogue={catalogue} emptyStateMessage="No fully paid outlet-stock sales in this date range."/></>}
 </CardContent></Card>;
}
