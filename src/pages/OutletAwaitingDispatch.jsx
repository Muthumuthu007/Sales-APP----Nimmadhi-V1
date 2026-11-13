import React,{useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {AuthContext} from '../context/AuthContext';
import api from '../api/axios';
import FactoryOrderProduct from '../components/FactoryOrderProduct';
import {sortFactoryDispatchOrders} from '../utils/factoryDispatchDates';
import {factoryProductName} from '../utils/saleProductName';
import {Card,CardContent,CardHeader} from '../components/ui/Card';
import {Button} from '../components/ui/Button';
import {Input,Select} from '../components/ui/Input';
import {Table} from '../components/ui/Table';
import {LoadingState,ErrorState} from '../components/ui/StateContainers';

const remaining=item=>Math.max(0,Number(item.orderedQty || 0)-Number(item.dispatchedQty || 0));
const pendingItems=order=>(order.dispatchItems || order.items || []).filter(item=>remaining(item)>0);

export default function OutletAwaitingDispatch(){
 const {outletId}=useContext(AuthContext);
 const [orders,setOrders]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [search,setSearch]=useState(''),[stage,setStage]=useState('ALL');
 const load=useCallback(async()=>{
  setLoading(true);setError('');setOrders([]);
  try{const data=await api.get('/outlet/awaiting-dispatch');setOrders(data.orders || []);}
  catch(err){setError(err.response?.data?.error || err.response?.data?.detail || 'Unable to load orders awaiting factory dispatch.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{load();},[load,outletId]);
 const visible=useMemo(()=>sortFactoryDispatchOrders(orders.filter(order=>
  (stage==='ALL' || order.status===stage) &&
  [order.displayId,order.orderId,order.customerName,order.customerPhone,...pendingItems(order).map(item=>factoryProductName(order,item))].join(' ').toLowerCase().includes(search.trim().toLowerCase())
 ),'DISPATCH_DATE','ASC'),[orders,search,stage]);
 const columns=[
  {key:'displayId',label:'Order number',render:row=><><strong>{row.displayId || row.orderId}</strong>{row.stallId&&<small style={{display:'block'}}>From stall: {row.stallName || row.stallId}</small>}</>},
  {key:'customerName',label:'Customer',render:row=><><strong>{row.customerName || 'Not recorded'}</strong><div>{row.customerPhone}</div><div style={{whiteSpace:'normal'}}>{row.customerAddress}</div></>},
  {key:'items',label:'Products awaiting dispatch',render:row=><div style={{display:'grid',gap:'1rem',minWidth:230}}>{pendingItems(row).map((item,index)=><div key={index}><FactoryOrderProduct order={row} item={item}/><div><strong>{remaining(item)} pending</strong> · Ordered {item.orderedQty} · Dispatched {item.dispatchedQty || 0}</div></div>)}{row.unresolvedComplimentary?.map((note,index)=><div key={`note-${index}`}>{note}<small style={{display:'block'}}>Complimentary quantity needs factory confirmation</small></div>)}</div>},
  {key:'dispatchDate',label:'Planned dispatch date',render:row=>row.dispatchDate || 'Not recorded'},
  {key:'createdByName',label:'Sales person'},
  {key:'status',label:'Status',render:row=><strong>{row.status==='PARTIALLY_DISPATCHED'?'Partially dispatched':'Awaiting dispatch'}</strong>},
 ];
 return <div style={{display:'grid',gap:'1rem'}}><Card><CardHeader title="Awaiting factory dispatch" action={<Button variant="secondary" disabled={loading} onClick={load}>Refresh</Button>}/><CardContent>
 <p>Factory customer orders for your outlet that still have items waiting for dispatch. This page is view only; Factory Management records dispatches.</p>
 <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginTop:'1rem'}}><Input label="Search orders" type="search" placeholder="Order number, customer or product" value={search} onChange={event=>setSearch(event.target.value)}/><Select label="Dispatch stage" value={stage} onChange={event=>setStage(event.target.value)} options={[{value:'ALL',label:'All orders with pending dispatch'},{value:'PENDING',label:'Awaiting dispatch'},{value:'PARTIALLY_DISPATCHED',label:'Partially dispatched'}]}/></div>
 </CardContent></Card>{loading?<LoadingState message="Loading orders awaiting factory dispatch…"/>:error?<ErrorState error={error} onRetry={load}/>:<Card><CardContent><p style={{marginBottom:'1rem'}}>{visible.length} {visible.length===1?'order':'orders'} · Earliest planned dispatch first</p><Table columns={columns} data={visible} emptyStateMessage={search || stage!=='ALL'?'No pending dispatch orders match these filters.':'No factory customer orders are awaiting dispatch for your outlet.'}/></CardContent></Card>}</div>;
}
