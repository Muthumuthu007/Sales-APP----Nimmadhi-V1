import React,{useContext,useEffect,useState} from 'react';
import api from '../api/axios';
import {businessDate} from '../utils/businessDate';
import {mappedMrp} from '../utils/productMrp';
import {ProductMrpContext} from '../context/ProductMrpContext';
import {Card,CardHeader,CardContent} from '../components/ui/Card';
import {Input} from '../components/ui/Input';
import {Button} from '../components/ui/Button';
import GroupedStockTable from '../components/GroupedStockTable';
const money=value=>value==null?'Not mapped':Number(value).toLocaleString('en-IN',{style:'currency',currency:'INR'});
const fields=['openingQty','receivedQty','soldQty','transferOutQty','closingQty'];
export default function StockMovementReport({outletId,catalogue,onBack}){
 const [day,setDay]=useState(businessDate),[snapshot,setSnapshot]=useState({key:'',rows:[],error:''}),[reload,setReload]=useState(0);
 const {prices}=useContext(ProductMrpContext);
 const requestKey=`${outletId}:${day}:${reload}`;
 const loading=snapshot.key!==requestKey,rows=loading?[]:snapshot.rows,error=loading?'':snapshot.error;
 useEffect(()=>{let active=true;api.get('/outlet/products',{params:{outletId,date:day}}).then(data=>{if(active)setSnapshot({key:requestKey,rows:data.products || [],error:''});}).catch(err=>{if(active)setSnapshot({key:requestKey,rows:[],error:err.response?.data?.error || 'Unable to load stock movement report.'});});return()=>{active=false;};},[outletId,day,requestKey]);
 const products=new Map(catalogue.map(p=>[String(p.value),p]));
 const data=rows.map(row=>{const product=products.get(String(row.product_id));const mrp=mappedMrp({...product,...row},prices);return {...row,referenceMrp:mrp,openingValue:mrp==null?null:Number(row.openingQty || 0)*mrp,closingValue:mrp==null?null:Number(row.closingQty || 0)*mrp};});
 const totals=Object.fromEntries(fields.map(field=>[field,data.reduce((sum,row)=>sum+Number(row[field] || 0),0)]));
 const columns=[{key:'productName',label:'Product'},{key:'referenceMrp',label:'Reference MRP',render:row=>money(row.referenceMrp)},...fields.map((key,index)=>({key,label:['Opening','Received / Returned In','Sold','Transferred / Returned Out','Closing'][index],render:row=>Number(row[key] || 0)})),{key:'openingValue',label:'Opening MRP Value',render:row=>money(row.openingValue)},{key:'closingValue',label:'Closing MRP Value',render:row=>money(row.closingValue)}];
 const download=()=>{
  const csvCell=value=>'"'+String(value ?? '').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
  const lines=[['Stock date',day],['Valuation','Current reference MRP; not historical costing'],columns.map(col=>col.label),...data.map(row=>columns.map(col=>row[col.key] ?? 'Not mapped'))];
  const url=URL.createObjectURL(new Blob(['\ufeff'+lines.map(line=>line.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`stock-movement-${outletId}-${day}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
 };
 return <Card><CardHeader title="Stock Movement Report" action={onBack&&<Button variant="secondary" onClick={onBack}>Back to reports</Button>}/><CardContent>
 <div style={{display:'flex',alignItems:'end',gap:'1rem',flexWrap:'wrap'}}><Input label="Stock report date" type="date" max={businessDate()} value={day} onChange={e=>{if(e.target.value)setDay(e.target.value);}}/><Button variant="secondary" disabled={loading} onClick={()=>setReload(v=>v+1)}>Refresh report</Button><Button disabled={loading || Boolean(error) || !data.length} onClick={download}>Download CSV</Button></div>
 <p>Opening + received − sold − transferred out = closing. Includes zero-stock products and balances carried forward on days without movement. Factory-to-customer deliveries do not reduce outlet stock.</p>
 <p>MRP values use the current product MRP as a reference, including for past dates; they are not historical costing. Products without an MRP show “Not mapped”.</p>
 {loading?<p role="status">Loading stock report…</p>:error?<p role="alert">{error}</p>:<>
 <div style={{display:'flex',flexWrap:'wrap',gap:'1.25rem',padding:'1rem 0'}}>{fields.map((field,index)=><div key={field}><span>{['Opening','Received','Sold','Transferred Out','Closing'][index]}</span><br/><strong>{totals[field]}</strong></div>)}</div>
 <GroupedStockTable catalogue={catalogue} columns={columns} data={data} emptyStateMessage="No stock records on or before this date."/>
 </>}
 </CardContent></Card>;
}
