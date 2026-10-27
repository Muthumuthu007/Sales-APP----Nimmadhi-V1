import React from 'react';
export default function PaymentBreakdown({amounts}) {
 if(!amounts)return null;
 return <div style={{display:'grid',gap:'.25rem',fontSize:'.85rem'}}>{Object.entries(amounts).filter(([,amount])=>Number(amount)>0).map(([method,amount])=><span key={method}>{method==='UNALLOCATED'?'Earlier payment · method not recorded':method}: {Number(amount).toLocaleString('en-IN',{style:'currency',currency:'INR'})}</span>)}</div>;
}
