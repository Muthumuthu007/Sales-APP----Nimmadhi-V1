import React from 'react';
import {Input} from './ui/Input';
import {businessDate} from '../utils/businessDate';
import {reportPeriodRange} from '../utils/reportPeriods';
export default function ReportPeriodPicker({period,anchor,onChange}){
 const range=reportPeriodRange(period,anchor);
 return <div><Input label={period==='monthly'?'Report month':period==='weekly'?'Week containing':'Report date'} type={period==='monthly'?'month':'date'} value={anchor} max={period==='monthly'?businessDate().slice(0,7):businessDate()} onChange={e=>onChange(e.target.value)}/>{range&&<small style={{display:'block',color:'var(--color-text-muted)',marginTop:'.4rem'}}>{range.start} to {range.end}{period==='weekly'?' · Monday–Sunday':''}{period!=='daily'&&range.end===businessDate()?' · Through today':''}</small>}</div>;
}
