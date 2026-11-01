import {businessDate} from './businessDate.js';

function validDay(value){
 const text=String(value || '');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return '';
 const parsed=new Date(`${text}T00:00:00Z`);
 return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===text?text:'';
}

// Today's planned dispatches first, upcoming dates ascending, then overdue and undated.
export function factoryDispatchDateGroups(orders,today=businessDate()){
 const grouped=new Map();
 for(const order of orders){
  const day=validDay(order.dispatchDate);
  if(!grouped.has(day))grouped.set(day,[]);
  grouped.get(day).push(order);
 }
 const rank=day=>!day?3:day===today?0:day>today?1:2;
 return [...grouped].sort(([a],[b])=>rank(a)-rank(b)||a.localeCompare(b)).map(([date,rows])=>({date,kind:!date?'undated':date===today?'today':date>today?'upcoming':'overdue',orders:[...rows].sort((a,b)=>String(a.displayId || a.orderId || '').localeCompare(String(b.displayId || b.orderId || ''),undefined,{numeric:true}))}));
}
