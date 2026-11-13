import React,{useCallback,useContext,useEffect,useState} from 'react';
import api from '../api/axios';
import {AuthContext} from '../context/AuthContext';
import FactoryDeliveryReturns from '../components/FactoryDeliveryReturns';
import {Button} from '../components/ui/Button';
import {Card,CardContent,CardHeader} from '../components/ui/Card';
import {LoadingState,ErrorState} from '../components/ui/StateContainers';

export default function OutletDeliveryReturns(){
 const {outletId}=useContext(AuthContext);
 const [data,setData]=useState({orders:[],outlet:null}),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!outletId){setLoading(false);return;}
  setLoading(true);setError('');
  try{setData(await api.get('/outlet/delivery-returns'));}
  catch(err){setError(err.response?.data?.error || err.response?.data?.detail || 'Unable to load delivery and returns.');}
  finally{setLoading(false);}
 },[outletId]);
 useEffect(()=>{setData({orders:[],outlet:null});load();},[load]);
 const record=useCallback((orderId,body)=>api.post(`/outlet/delivery-returns/${encodeURIComponent(orderId)}`,body),[]);
 return <Card><CardHeader title="Outlet delivery & returns" action={<Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>}/><CardContent>
 {loading?<LoadingState message="Loading dispatched factory deliveries…"/>:error?<ErrorState error={error} onRetry={load}/>:<><p style={{marginBottom:'1rem'}}>Only factory customer orders belonging to your outlet with dispatched quantities appear here. Items awaiting their first dispatch are excluded.</p><FactoryDeliveryReturns key={outletId} orders={data.orders || []} outlets={data.outlet?[data.outlet]:[]} receivingLocationId={outletId} recordAction={record} onRefresh={load}/></>}
 </CardContent></Card>;
}
