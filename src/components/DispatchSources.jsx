import React from 'react';
export default function DispatchSources({sources=[]}) {
 if (!sources.length) return <span className="text-muted">Source not recorded</span>;
 return <div style={{display:'grid',gap:'0.35rem',minWidth:150}}>{sources.map((source,index)=><div key={`${source.sourceType}-${source.sourceLocationId}-${index}`}>
  <strong>{source.sourceType==='FACTORY'?'Factory':source.sourceType==='GODOWN'?`Godown${source.sourceLocationId ? ` (${source.sourceLocationId})` : ''}`:'Source not recorded'}</strong>
  <div className="text-muted" style={{fontSize:'0.82rem'}}>{source.dispatchedQty || 0} dispatched{source.assignedQty > source.dispatchedQty ? ` · ${source.assignedQty-source.dispatchedQty} pending` : ''}</div>
 </div>)}</div>;
}
