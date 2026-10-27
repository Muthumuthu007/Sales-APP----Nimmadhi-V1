import React from 'react';
import {Input} from './ui/Input';
import {paymentMethods,splitPayments} from '../utils/paymentSplits';
export default function PaymentSplitInput({values,onChange,onTotalChange,disabled=false}) {
 const parsed=splitPayments(values);
 return <fieldset disabled={disabled} style={{minWidth:0,padding:'.75rem',border:'1px solid var(--color-primary)',borderRadius:'.6rem'}}><legend>Split amount received</legend><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'.75rem'}}>{paymentMethods.map(method=><Input key={method} label={`${method} (₹)`} type="number" min="0" step="0.01" value={values[method] || ''} onChange={event=>{const next={...values,[method]:event.target.value};onChange(next);onTotalChange(String(splitPayments(next)?.total ?? 0));}} />)}</div><p role="status">{parsed?`Total received: ₹${parsed.total.toLocaleString('en-IN')}`:'Enter valid amounts with at most two decimal places.'}</p><small>Leave unused payment methods blank.</small></fieldset>;
}
