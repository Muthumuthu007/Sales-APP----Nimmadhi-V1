import {salesEnterKey} from '../utils/salesKeyboard';
import React,{useState} from 'react';
import {Modal} from './ui/Modal';
import {Input,Select} from './ui/Input';
import {Button} from './ui/Button';
import {showroomItemForProduct,emptyShowroomItem} from '../utils/showroomPricing';
const money=n=>Number(n || 0).toLocaleString('en-IN',{style:'currency',currency:'INR'});
export default function ComboSaleDialog({combo,onClose,onAdd,products,stockLabel}){
 const [count,setCount]=useState('1'),[error,setError]=useState('');
 const [rows,setRows]=useState(()=>combo.saleItems.map(item=>{const option=products.find(p=>p.value===item.product_id);return {...showroomItemForProduct({...emptyShowroomItem},option || {label:item.productName}),...item,quantity:Number(item.qty),taxPercent:'18',fulfillmentMode:'',isAccessory:Boolean(option?.isAccessory)};}));
 const change=(index,key,value)=>setRows(current=>current.map((item,i)=>index===i?{...item,[key]:value}:item));
 const confirm=()=>{
  if(!Number.isSafeInteger(Number(count)) || Number(count)<1 || Number(count)>100){setError('Choose a whole combo quantity between 1 and 100.');return;}
  const missing=rows.flatMap((item,index)=>[...(!item.fulfillmentMode?[`Product ${index+1}: select a delivery source.`]:[]),...(!item.isAccessory && (!item.colour.trim() || !item.size.trim())?[`Product ${index+1}: enter its colour and size.`]:[])]);
  if(missing.length){setError(missing.join(' '));return;}
  const selection=crypto.randomUUID();
  onAdd(rows.map(({qty,...item})=>({...item,quantity:Number(qty)*Number(count),comboId:combo.comboId,comboName:combo.comboName,comboVersion:Number(combo.version),comboCount:Number(count),comboSelectionId:selection})));onClose();
 };
 return <Modal isOpen={Boolean(combo)} onClose={onClose} title={combo?`Sell combo · ${combo.comboName}`:'Sell combo'}>{combo&&<div className="combo-form" onKeyDown={salesEnterKey}><p>Confirm delivery and specifications for each product. Combo products and prices are kept together.</p><Input label="Number of combos" type="number" min="1" max="100" step="1" value={count} onChange={event=>setCount(event.target.value)}/>{rows.map((item,index)=><section key={index} className="combo-product-picker"><strong>{item.productName} × {Number(item.qty)*Number(count || 0)}</strong><small>MRP {money(item.mrpSticker)} · Discount per unit {money(item.discountAmount)} · Unit price {money(Number(item.mrpSticker)-Number(item.discountAmount))}</small><Select label={`Delivery source · ${item.productName} (${index+1})`} value={item.fulfillmentMode} onChange={event=>change(index,'fulfillmentMode',event.target.value)} options={[{value:'',label:'Select delivery source'},{value:'LOCAL_STOCK',label:'Outlet stock → customer'},{value:'FACTORY_DELIVERY',label:'Factory → customer'}]}/><small>Outlet stock: {stockLabel(item.product_id,item.fulfillmentMode)}</small><div className="combo-grid"><Input label={`Colour${item.isAccessory?' (optional)':''} · ${index+1}`} maxLength={80} value={item.colour} onChange={event=>change(index,'colour',event.target.value)}/><Input label={`Size${item.isAccessory?' (optional)':''} · ${index+1}`} maxLength={80} value={item.size} onChange={event=>change(index,'size',event.target.value)}/></div></section>)}<strong>Combo total: {money(Number(combo.comboMrp)*Number(count || 0))}</strong>{error&&<p role="alert">{error}</p>}<Button disabled={!rows.length} onClick={confirm}>Add combo to bill</Button></div>}</Modal>;
}
