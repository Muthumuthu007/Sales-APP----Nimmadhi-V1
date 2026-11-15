import React from 'react';
export default function EmergencyTransferNote({replacement,transfer}){
 const info=replacement || transfer;if(!info)return null;
 return <small style={{display:'block',padding:'.5rem',marginTop:'.5rem',border:'1px solid var(--color-primary)',borderRadius:'.5rem',whiteSpace:'normal'}}><strong>{replacement?'Automatic emergency replacement':'Emergency stock transfer'}</strong><br/>{info.reference} · {info.quantity} units originally for {info.fromOutletId} sent to {info.toOutletId} from {info.godownId}.{replacement&&<> Factory replacement is for <strong>all {info.replacementQuantity ?? info.quantity} units for {info.fromOutletId}</strong>; automatically approved.{Number(info.permanentQuantity)>0&&<> {info.permanentQuantity} remaining units moved to permanent godown stock.</>}</>}<br/>Reason: {info.reason}</small>;
}
