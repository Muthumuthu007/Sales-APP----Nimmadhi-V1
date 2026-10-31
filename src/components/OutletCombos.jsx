import React,{useEffect,useState} from 'react';
import api from '../api/axios';
import {Card,CardHeader,CardContent} from './ui/Card';
import {Button} from './ui/Button';
const money=n=>Number(n || 0).toLocaleString('en-IN',{style:'currency',currency:'INR'});
export default function OutletCombos({onChoose,compact=false}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[reload,setReload]=useState(0);
 useEffect(()=>{let current=true;api.get('/outlet/combos').then(result=>{if(current){setData(result);setError('');}}).catch(()=>{if(current)setError('Unable to load this outlet’s combos.');});return()=>{current=false;};},[reload]);
 return <Card><CardHeader title={compact?'Choose a combo':'Outlet combos'} action={<Button variant="secondary" onClick={()=>setReload(value=>value+1)}>Refresh combos</Button>}/><CardContent>{error?<p role="alert">{error}</p>:!data?<p role="status">Loading combos…</p>:!data.combos.length?<p>No active combos are assigned to this outlet.</p>:<div className="combo-saved">{data.combos.map(combo=><article key={combo.comboId}><h3>{combo.comboName}</h3>{combo.items.map(item=><p key={item.productId}>{item.productName} × {item.quantity}</p>)}<p>Product MRP: {money(combo.productsMrp)}<br/><strong>Combo price: {money(combo.comboMrp)}</strong></p>{data.canSell&&onChoose&&<Button disabled={Boolean(combo.saleError)} onClick={()=>onChoose(combo)}>Sell this combo</Button>}{combo.saleError&&<small>{combo.saleError}</small>}</article>)}</div>}</CardContent></Card>;
}
