function validDay(value){
 const text=String(value || '');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return '';
 const parsed=new Date(`${text}T00:00:00Z`);
 return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===text?text:'';
}

const compareReference=(a,b)=>String(a.displayId || a.orderId || '').localeCompare(String(b.displayId || b.orderId || ''),undefined,{numeric:true});

export function sortFactoryDispatchOrders(orders,orderBy='DISPATCH_DATE'){
 return [...orders].sort((a,b)=>{
  if(orderBy==='ORDER_ID')return compareReference(a,b);
  const left=validDay(a.dispatchDate),right=validDay(b.dispatchDate);
  if(!left && right)return 1;
  if(left && !right)return -1;
  return left.localeCompare(right)||compareReference(a,b);
 });
}
