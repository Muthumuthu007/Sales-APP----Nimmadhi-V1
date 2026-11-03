import React,{useState} from 'react';
import {Button} from './ui/Button';
import {Modal} from './ui/Modal';
import './SaleEditHistory.css';
const when=value=>value?new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}):'Time not recorded';
export default function SaleEditHistory({invoice}){
 const [open,setOpen]=useState(false);
 const history=invoice.corrections || [],count=Math.max(Number(invoice.editVersion || 0),history.length);
 if(!count)return <span className="sale-not-edited">Original · Not edited</span>;
 return <div className="sale-edit-indicator"><strong className="sale-edited-badge">Edited · {count} {count===1?'time':'times'}</strong>{history[0]&&<small>{when(history[0].at)}<br/>{history[0].by || 'User not recorded'}</small>}<Button variant="secondary" onClick={()=>setOpen(true)}>View edit history</Button>
 <Modal isOpen={open} onClose={()=>setOpen(false)} title={`Edit history · ${invoice.workOrderNo || invoice.billNo || invoice.saleReferenceId}`}>
 <p>Changes to this bill are shown below. Times are in IST.</p>
 {!history.length?<p>Detailed history is unavailable for this older correction.</p>:history.map((entry,index)=><section className="sale-edit-entry" key={`${entry.at}-${index}`}><header><strong>Correction {entry.version || history.length-index}</strong><span>{when(entry.at)} · {entry.by || 'User not recorded'}</span></header><p className="sale-edit-reason"><strong>Reason:</strong> {entry.reason || 'Not recorded'}</p>{entry.changes?.length?<div className="sale-edit-changes" role="table" aria-label="Changed bill details"><div className="sale-edit-change-row sale-edit-change-heading" role="row"><strong role="columnheader">Detail</strong><strong role="columnheader">Before</strong><strong role="columnheader">After</strong></div>{entry.changes.map((change,i)=><div className="sale-edit-change-row" role="row" key={i}><strong role="cell">{change.field}</strong><span role="cell">{change.before}</span><span role="cell">{change.after}</span></div>)}</div>:<p>No field differences were recorded for this correction.</p>}</section>)}
 </Modal></div>;
}
