import {businessDate} from '../utils/businessDate';
import React, {useEffect, useRef, useState} from 'react';
import api from '../api/axios';
import {Card, CardHeader, CardContent} from './ui/Card';
import {Input, Select} from './ui/Input';
import {Button} from './ui/Button';
import {Table} from './ui/Table';
import './GodownReports.css';
const today = businessDate;
export default function GodownReports() {
 const [kind,setKind]=useState('temporary'),[period,setPeriod]=useState('daily'),[date,setDate]=useState(today),[location,setLocation]=useState(''),[outlet,setOutlet]=useState('');
 const [report,setReport]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[downloading,setDownloading]=useState(false);
 const generation=useRef(0);
 useEffect(()=>{let active=true;const id=++generation.current;setLoading(true);setError('');api.get('/godown/reports',{params:{kind,period,date,location:kind==='temporary'?location:'',outlet:kind==='temporary'?outlet:''}}).then(data=>{if(active&&id===generation.current)setReport(data);}).catch(err=>{if(active&&id===generation.current)setError(err.response?.data?.error||'Unable to load report. Use Generate report to retry.');}).finally(()=>{if(active&&id===generation.current)setLoading(false);});return()=>{active=false;};},[kind,period,date,location,outlet]);
 const reload=async()=>{setLoading(true);setError('');const id=++generation.current;try{const data=await api.get('/godown/reports',{params:{kind,period,date,location:kind==='temporary'?location:'',outlet:kind==='temporary'?outlet:''}});if(id===generation.current)setReport(data);}catch{if(id===generation.current)setError('Unable to load report. Please retry.');}finally{if(id===generation.current)setLoading(false);}};
 const download=async()=>{if(!report)return;setDownloading(true);setError('');try{const blob=await api.get('/godown/reports',{params:{kind:report.kind,period:report.period,date:report.start,location:report.location,outlet:report.outlet,download:'xlsx'},responseType:'blob'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`godown-${report.kind}-${report.start}-${report.end}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{setError('Unable to download Excel. Please retry.');}finally{setDownloading(false);}};
 return <div className="godown-reports"><Card><CardHeader title="Godown Reports"/><CardContent><div className="godown-report-controls">
 <Select label="Report" value={kind} onChange={e=>{setKind(e.target.value);setLocation('');setOutlet('');}} options={[{value:'temporary',label:'Temporary stock — In & Out'},{value:'stock',label:'Own stock — Orders & Receipts'}]}/>
 <Select label="Period" value={period} onChange={e=>setPeriod(e.target.value)} options={[{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly (Monday–Sunday)'},{value:'monthly',label:'Monthly'}]}/>
 <Input label={period==='daily'?'Report date':period==='weekly'?'Choose a date in the week':'Choose a date in the month'} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
 {kind==='temporary'&&<><Select label="Location" value={location} onChange={e=>{setLocation(e.target.value);setOutlet('');}} options={[{value:'',label:'All locations'},...(report?.locations||[]).map(x=>({value:x,label:x}))]}/><Select label="Outlet" value={outlet} onChange={e=>setOutlet(e.target.value)} options={[{value:'',label:'All outlets'},...(report?.outlets||[]).filter(o=>!location||o.location===location).map(o=>({value:o.outletId,label:`${o.outletName} (${o.outletId})`}))]}/></>}
 </div><div className="godown-report-actions"><Button onClick={reload} disabled={loading||!date}>Generate report</Button><Button variant="secondary" onClick={download} disabled={loading||!report||downloading}>{downloading?'Downloading…':'Download Excel'}</Button><Button variant="secondary" onClick={()=>window.print()} disabled={loading||!report}>Print report</Button></div>{loading&&<p role="status">Generating report…</p>}{error&&<p role="alert">{error}</p>}</CardContent></Card>
 {report&&!loading&&<article className="godown-report-print"><header><h2>{report.title}</h2><p><strong>{report.godown}</strong> · {report.period.toUpperCase()} · {report.start} to {report.end}</p>{report.kind==='temporary'&&<p>Location: {report.location||'All'} · Outlet: {report.outlet||'All'}</p>}<p className="godown-report-note">{report.note}</p></header>
 {report.sections.map(section=><section key={section.title}><h3>{section.title}</h3><div className="godown-report-totals">{section.columns.filter(c=>Object.hasOwn(section.totals,c.key)).map(c=><div key={c.key}><span>{c.label}</span><strong>{Number(section.totals[c.key]).toLocaleString('en-IN')}</strong></div>)}</div><Table columns={section.columns} data={section.rows} emptyStateMessage="No records for this period and filter."/></section>)}
 </article>}
 </div>;
}
