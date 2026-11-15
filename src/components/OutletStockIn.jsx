import QRReprintHistory from './QRReprintHistory';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import api from '../api/axios';
import GroupedProductPicker from './GroupedProductPicker';
import {productionOption} from '../utils/productHierarchy';
import {Button} from './ui/Button';
import {Input} from './ui/Input';
import {Card,CardHeader,CardContent} from './ui/Card';
import {Modal} from './ui/Modal';
import UnitProductLabel from './UnitProductLabel';
import {initialUnitLabel,unitLabelPrintDocument} from '../utils/unitLabel';

const loadQRHistory=()=>api.get('/outlet/stock-in/qr-history');
const loadQRBatch=id=>api.get(`/outlet/stock-in/qr-history/${encodeURIComponent(id)}`);

export default function OutletStockIn({onSaved}){
 const [showQRHistory,setShowQRHistory]=useState(false);
 const [products,setProducts]=useState([]),[receipts,setReceipts]=useState([]),[product,setProduct]=useState(''),[quantity,setQuantity]=useState('1'),[supplier,setSupplier]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[savedReceipt,setSavedReceipt]=useState(null);
 const requestId=useRef(null),labelRefs=useRef(new Map());
 const [labelReceipt,setLabelReceipt]=useState(null),[details,setDetails]=useState(initialUnitLabel('')),[units,setUnits]=useState([]),[labelError,setLabelError]=useState(''),[labelBusy,setLabelBusy]=useState(false),[width,setWidth]=useState(89),[height,setHeight]=useState(45);
 const load=useCallback(async()=>{setLoading(true);try{const data=await api.get('/outlet/stock-in',{timeout:120000});setProducts((data.products || []).map(productionOption));setReceipts(data.receipts || []);setError('');}catch(err){setError(err.response?.data?.error || 'Unable to load accessories and stock receipts. Use Refresh to retry.');}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 const change=(setter,value)=>{requestId.current=null;setter(value);};
 const save=async()=>{
  const count=Number(quantity);if(!product || !Number.isSafeInteger(count)||count<1||count>1000){setError('Choose an accessory and a whole quantity between 1 and 1000.');return;}
  setBusy(true);setError('');requestId.current ||= crypto.randomUUID();
  try{const result=await api.post('/outlet/stock-in',{requestId:requestId.current,productId:product,quantity:count,supplier},{timeout:120000});setSavedReceipt(result.receipt);setNotice(`${result.receipt.reference}: ${result.receipt.quantity} ${result.receipt.productName} added to this outlet’s stock. QR printing is optional below.`);requestId.current=null;setProduct('');setQuantity('1');setSupplier('');onSaved?.();await load();}catch(err){setError(err.response?.data?.error || 'Unable to confirm receipt. Retry with the same details to avoid adding stock twice.');}finally{setBusy(false);}
 };
 const openLabels=async receipt=>{
  setLabelReceipt(receipt);setUnits([]);setDetails(initialUnitLabel(receipt.productName,receipt.mrpSticker));setLabelError('');setLabelBusy(true);
  try{const data=await api.get(`/outlet/stock-in/${receipt.receiptId}/labels`);setLabelReceipt(data.receipt);setDetails(data.receipt.labelDetails || initialUnitLabel(receipt.productName,receipt.mrpSticker));setUnits(data.units || []);}catch(err){setLabelError(err.response?.data?.error || 'Unable to load saved QR labels. Close and retry.');}finally{setLabelBusy(false);}
 };
 const prepare=async()=>{
  if(!labelReceipt)return;
  if(!details.commodity.trim() || !details.quality.trim() || !details.size.trim() || !/^\d{4}-\d{2}$/.test(details.manufacturing_month) || !Number.isFinite(Number(details.mrp)) || Number(details.mrp)<=0){setLabelError('Complete commodity, quality, size/specification, manufacturing month and a positive sticker MRP before preparing labels.');return;}
  setLabelBusy(true);setLabelError('');
  try{
   let current=await api.get(`/outlet/stock-in/${labelReceipt.receiptId}/labels`);
   while(Number(current.receipt.qrGeneratedQuantity || 0)<Number(current.receipt.quantity)){
    const offset=Number(current.receipt.qrGeneratedQuantity || 0);
    const next=await api.post(`/outlet/stock-in/${labelReceipt.receiptId}/labels`,{offset,labelDetails:current.receipt.labelDetails || details},{timeout:120000});
    if(Number(next.receipt.qrGeneratedQuantity)<=offset)throw Error('QR progress did not advance. Close and reopen this saved receipt.');
    current=next;setLabelReceipt(current.receipt);setUnits(current.units || []);if(current.receipt.labelDetails)setDetails(current.receipt.labelDetails);
   }
   setLabelReceipt(current.receipt);setUnits(current.units || []);setDetails(current.receipt.labelDetails || details);
   setNotice(`${current.receipt.quantity} saved QR labels are ready. Reprinting uses these same labels and does not add stock.`);
  }catch(err){setLabelError(err.response?.data?.error || err.message || 'QR generation stopped. Retry to resume the same receipt; stock is already saved.');}finally{setLabelBusy(false);}
 };
 const print=()=>{
  if(!labelReceipt || units.length!==Number(labelReceipt.quantity)){setLabelError('Prepare all labels for this receipt before printing.');return;}
  const markup=units.map(unit=>labelRefs.current.get(unit.unit_id)?.outerHTML);
  if(markup.some(value=>!value)){setLabelError('Some labels are not ready. Please retry after the previews load.');return;}
  let html;try{html=unitLabelPrintDocument(markup,Number(width),Number(height));}catch(err){setLabelError(err.message);return;}
  const popup=window.open('','_blank','width=420,height=520');if(!popup){setLabelError('Allow pop-ups for this website, then try printing again.');return;}
  popup.document.open();popup.document.write(html);popup.document.close();popup.opener=null;
 };
 const locked=Number(labelReceipt?.qrGeneratedQuantity || 0)>0;
 return <Card><CardHeader title="Stock In — third-party accessories" action={<Button variant="secondary" onClick={load} disabled={loading||busy}>Refresh</Button>}/><CardContent>
 <p>Receive accessories purchased from third parties into your assigned outlet. This creates a stock receipt, without creating a sale or an order.</p>
 <div style={{margin:'16px 0'}}><Button variant="secondary" onClick={()=>setShowQRHistory(true)}>Reprint QR — last 3 days</Button></div>
 {showQRHistory&&<QRReprintHistory loadHistory={loadQRHistory} loadBatch={loadQRBatch} onClose={()=>setShowQRHistory(false)}/>}
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {loading?<p role="status">Loading accessories…</p>:<div style={{maxWidth:800,display:'grid',gap:'1rem'}}><GroupedProductPicker label="Accessory" options={products} value={product} onChange={value=>change(setProduct,value)} disabled={busy}/><Input label="Quantity received" type="number" min="1" max="1000" step="1" value={quantity} disabled={busy} onChange={e=>change(setQuantity,e.target.value)}/><Input label="Supplier / reference (optional)" maxLength={150} value={supplier} disabled={busy} onChange={e=>change(setSupplier,e.target.value)}/><Button disabled={busy||!product} onClick={save}>{busy?'Saving stock receipt…':'Stock in'}</Button>{!products.length&&<p>No accessory products are assigned to this outlet. Ask the admin to check the product catalogue.</p>}</div>}
 {savedReceipt&&<section style={{margin:'1.5rem 0',padding:'1rem',border:'1px solid var(--color-primary)',borderRadius:12}}><h3>Stock receipt saved</h3><p>{savedReceipt.reference} · {savedReceipt.productName} × {savedReceipt.quantity}</p><Button onClick={()=>openLabels(savedReceipt)} disabled={labelBusy}>Print QR labels ({savedReceipt.quantity})</Button></section>}
 <h3>Recent third-party stock receipts</h3><div style={{display:'grid',gap:12}}>{receipts.map(receipt=><article key={receipt.receiptId} style={{padding:'1rem',border:'1px solid var(--color-border)',borderRadius:12}}><strong>{receipt.reference} · {receipt.productName}</strong><p>{receipt.quantity} received · {new Date(receipt.createdAt).toLocaleString()}{receipt.supplier&&` · ${receipt.supplier}`}</p><small>{receipt.groupPath}</small><div><Button variant="secondary" onClick={()=>openLabels(receipt)} disabled={labelBusy}>Print / reprint QR labels ({receipt.quantity})</Button></div></article>)}</div>
 <Modal isOpen={Boolean(labelReceipt)} onClose={()=>!labelBusy&&setLabelReceipt(null)} title="QR labels for saved stock receipt">
 {labelReceipt&&<><p>{labelReceipt.reference} · {labelReceipt.productName} · {labelReceipt.quantity} pieces. Each piece receives one unique QR using the existing label format.</p>{labelError&&<p role="alert">{labelError}</p>}
 <div style={{display:'grid',gap:12,gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,180px),1fr))'}}>{[['commodity','Commodity'],['quality','Quality / product'],['size','Size / specification'],['manufacturing_month','Manufacturing month'],['mrp','Sticker MRP (₹)']].map(([key,label])=><Input key={key} label={label} type={key==='manufacturing_month'?'month':key==='mrp'?'number':'text'} step={key==='mrp'?'0.01':undefined} value={details[key]} disabled={locked||labelBusy} onInput={key==='manufacturing_month'?e=>setDetails(current=>({...current,[key]:e.target.value})):undefined} onChange={e=>setDetails(current=>({...current,[key]:e.target.value}))}/>)}<Input label="Sticker width (mm)" type="number" value={width} onChange={e=>setWidth(e.target.value)}/><Input label="Sticker height (mm)" type="number" value={height} onChange={e=>setHeight(e.target.value)}/></div>
 <p>{units.length} / {labelReceipt.quantity} labels prepared. Stock is already saved; preparing or reprinting labels will not change stock.</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button onClick={prepare} disabled={labelBusy||units.length===Number(labelReceipt.quantity)}>{labelBusy?'Preparing saved labels…':'Prepare QR labels'}</Button><Button onClick={print} disabled={labelBusy||units.length!==Number(labelReceipt.quantity)}>Print all QR labels ({labelReceipt.quantity})</Button><Button variant="secondary" onClick={()=>setLabelReceipt(null)} disabled={labelBusy}>Close</Button></div>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,200px),1fr))',gap:16,marginTop:16}}>{units.map(unit=><div key={unit.unit_id}><div ref={node=>{if(node)labelRefs.current.set(unit.unit_id,node.firstElementChild);else labelRefs.current.delete(unit.unit_id);}}><UnitProductLabel details={details} unitId={unit.unit_id}/></div><small>{unit.unit_id}</small></div>)}</div>
 </>}
 </Modal>
 </CardContent></Card>;
}
