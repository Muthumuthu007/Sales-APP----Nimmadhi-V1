import SalesHsnSettings from '../components/SalesHsnSettings';
import React,{useEffect,useRef,useState} from 'react';
import api from '../api/axios';
import {businessDate} from '../utils/businessDate';
import {Button} from '../components/ui/Button';
import {Card,CardContent,CardHeader} from '../components/ui/Card';
import {LoadingState,ErrorState} from '../components/ui/StateContainers';
import './AdminSalesRecord.css';

const types=[['ALL','Overall sales'],['OWN','Own outlet sales'],['OTHER','Other outlets sales']];
const columns=[['orderNumber','Order Number'],['orderDate','Order Date'],['itemName','Item name'],['hsnCode','HSN Code'],['salesQty','Sales Qty'],['customerName','Customer Name'],['address','Address'],['phoneNumber','Phone Number'],['gstNo','GST No.'],['taxableAmount','Taxable amount'],['salesTax','Sales tax'],['sgstTaxAmt','SGST TaxAmt'],['cgstTaxAmt','CGST TaxAmt'],['igstTaxAmt','IGST TaxAmt'],['totalAmount','Total amount']];
const numeric=new Set(['salesQty','taxableAmount','salesTax','sgstTaxAmt','cgstTaxAmt','igstTaxAmt','totalAmount']);
const format=(value,key)=>value===null||value===undefined||value===''?'':key==='orderDate'?new Date(value+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'}):numeric.has(key)?Number(value).toLocaleString('en-IN',{maximumFractionDigits:2,minimumFractionDigits:['salesQty','salesTax'].includes(key)?0:2}):value;
export default function AdminSalesRecord(){
 const [filters,setFilters]=useState({startDate:businessDate(),endDate:businessDate(),salesType:'ALL'}),[data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[exportError,setExportError]=useState(''),[exporting,setExporting]=useState(false),[page,setPage]=useState(1);
 const [hsnOpen,setHsnOpen]=useState(false),[hsnNotice,setHsnNotice]=useState('');
 const sequence=useRef(0);
 const load=async params=>{
  const id=++sequence.current;setLoading(true);setError('');setExportError('');
  try{const response=await api.get('/manager/sales-record',{params,timeout:120000});if(id===sequence.current){setData(response);setPage(1);}}
  catch(err){if(id===sequence.current){setData(null);setError(err.response?.data?.error || 'Unable to load the sales record. Please try again.');}}
  finally{if(id===sequence.current)setLoading(false);}
 };
 useEffect(()=>{const tracker=sequence;load({startDate:businessDate(),endDate:businessDate(),salesType:'ALL'});return()=>{tracker.current++;};},[]);
 const apply=e=>{e.preventDefault();if(filters.startDate>filters.endDate){setError('From date must be on or before To date.');return;}load({...filters});};
 const download=async()=>{
  if(!data)return;setExporting(true);setExportError('');
  try{
   const blob=await api.get('/manager/sales-record',{params:{startDate:data.startDate,endDate:data.endDate,salesType:data.salesType,export:'xlsx'},responseType:'blob',timeout:120000});
   const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Sales_${data.salesType}_${data.startDate}_${data.endDate}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(err){let message='Unable to export sales records. Please try again.';if(err.response?.data instanceof Blob){try{message=JSON.parse(await err.response.data.text()).error || message;}catch{/* Retain the readable fallback for network or non-JSON errors. */}}setExportError(message);}
  finally{setExporting(false);}
 };
 const rows=data?.rows || [],size=50,pages=Math.max(1,Math.ceil(rows.length/size));
 return <div className="admin-sales-record"><Card><CardHeader title="Sales Record" action={<Button variant="secondary" onClick={()=>setHsnOpen(true)}>Edit HSN codes</Button>}/><CardContent>
 <p className="asr-muted">View sales by sale date and export the Sales sheet in the supplied Excel format.</p>
 <form className="asr-filters" onSubmit={apply}><label>From date<input type="date" required value={filters.startDate} onChange={e=>setFilters({...filters,startDate:e.target.value})}/></label><label>To date<input type="date" required min={filters.startDate} value={filters.endDate} onChange={e=>setFilters({...filters,endDate:e.target.value})}/></label><label>Sales category<select value={filters.salesType} onChange={e=>setFilters({...filters,salesType:e.target.value})}>{types.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><Button type="submit" disabled={loading}>{loading?'Loading…':'Apply filters'}</Button></form>
 </CardContent></Card>
 {hsnNotice&&<p className="asr-notice" role="status">{hsnNotice}</p>}
 {loading?<LoadingState message="Loading sales records…"/>:error?<ErrorState error={error} onRetry={()=>load({...filters})}/>:data&&<>
 <div className="asr-summary">{[['Invoices',data.summary.invoices],['Sales quantity',format(data.summary.quantity,'salesQty')],['Taxable amount recorded','₹'+format(data.summary.taxableAmount,'totalAmount')],['Total sales','₹'+format(data.summary.totalAmount,'totalAmount')]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
 <Card><CardHeader title={`${types.find(([v])=>v===data.salesType)?.[1]} · ${format(data.startDate,'orderDate')} to ${format(data.endDate,'orderDate')}`} action={<Button onClick={download} disabled={exporting}>{exporting?'Exporting…':'Export as Excel'}</Button>}/><CardContent>
 <p className="asr-muted">{data.taxSplitNote} HSN codes use the supplied product-category mapping. Bare and unassigned categories remain blank. Invoice rounding is listed separately so totals match recorded sales.</p>
 {data.summary.missingHsnLines>0&&<p className="asr-notice" role="status">{data.summary.missingHsnLines} sales line(s) have no assigned HSN code, including Bare where applicable.</p>}
 {data.summary.missingTaxLines>0&&<p className="asr-notice" role="status">{data.summary.missingTaxLines} sales line(s) have incomplete saved tax information. Their missing tax fields are blank; they are still included in sales totals.</p>}
 {exportError&&<p role="alert" className="asr-notice">{exportError}</p>}
 <div className="asr-table" tabIndex="0" role="region" aria-label="Sales details, scroll horizontally for all columns"><table><thead><tr>{columns.map(([key,label])=><th scope="col" key={key}>{label}</th>)}</tr></thead><tbody>{rows.slice((page-1)*size,page*size).map((row,index)=><tr key={`${row.outletId}-${row.saleId}-${index}`} title={`Outlet: ${row.outletId}`} >{columns.map(([key])=><td className={numeric.has(key)?'asr-number':''} key={key}>{format(row[key],key)}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="asr-empty">No sales in the selected date range and category.</p>}</div>
 <div className="asr-pagination"><small>{rows.length} lines · Export includes all matching lines</small><div><Button variant="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</Button><span>Page {page} of {pages}</span><Button variant="secondary" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next</Button></div></div>
 </CardContent></Card></>}
 <SalesHsnSettings isOpen={hsnOpen} onClose={()=>setHsnOpen(false)} onSaved={result=>{setHsnOpen(false);setHsnNotice(result.message);if(data)load({startDate:data.startDate,endDate:data.endDate,salesType:data.salesType});}}/>
 </div>;
}
