import {businessDate} from './businessDate.js';
export const reportPeriods=[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']];
export function reportPeriodRange(period,anchor,today=businessDate()){
 const value=period==='monthly'?`${anchor}-01`:anchor;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value || ''))return null;
 const d=new Date(`${value}T00:00:00Z`);
 if(!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==value || value>today)return null;
 const iso=date=>date.toISOString().slice(0,10);
 let start=value,end=value;
 if(period==='weekly'){
  d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);start=iso(d);d.setUTCDate(d.getUTCDate()+6);end=iso(d);
 }else if(period==='monthly'){
  start=value;d.setUTCMonth(d.getUTCMonth()+1,0);end=iso(d);
 }else if(period!=='daily')return null;
 return {start,end:end>today?today:end};
}
