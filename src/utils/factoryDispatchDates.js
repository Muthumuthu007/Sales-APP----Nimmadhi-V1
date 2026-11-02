function validDay(value){
 const text=String(value || '');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return '';
 const parsed=new Date(`${text}T00:00:00Z`);
 return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===text?text:'';
}

function createdTime(value){
 const text=String(value || '');
 if(!validDay(text.slice(0,10)))return null;
 const timestamp=Date.parse(text.length===10?`${text}T00:00:00+05:30`:text);
 return Number.isFinite(timestamp)?timestamp:null;
}

const compareReference=(a,b)=>String(a.displayId || a.orderId || '').localeCompare(String(b.displayId || b.orderId || ''),undefined,{numeric:true});

export function sortFactoryDispatchOrders(orders,orderBy='DISPATCH_DATE',direction='ASC'){
 const factor=direction==='DESC'?-1:1;
 return [...orders].sort((a,b)=>{
  if(orderBy==='ORDER_ID')return factor*compareReference(a,b);
  if(orderBy==='CREATED_DATE'){
   const left=createdTime(a.createdAt),right=createdTime(b.createdAt);
   if(left===null && right!==null)return 1;
   if(left!==null && right===null)return -1;
   return factor*((left!==null && right!==null?left-right:0)||compareReference(a,b));
  }
  const left=validDay(a.dispatchDate),right=validDay(b.dispatchDate);
  if(!left && right)return 1;
  if(left && !right)return -1;
  return factor*(left.localeCompare(right)||compareReference(a,b));
 });
}
