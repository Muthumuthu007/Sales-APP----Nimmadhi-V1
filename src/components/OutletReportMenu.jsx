import React from 'react';
import {Calendar,CalendarRange,FileText} from 'lucide-react';
import {reportPeriods} from '../utils/reportPeriods';
import './OutletReportMenu.css';
export default function OutletReportMenu({ownOutlet,onOpen}){
 const sections=[{id:'sales',title:'Sales Reports',description:'Sales, payments and bill details for your outlet.'},{id:'stock',title:'Stock Movement Reports',description:'Opening and closing balances, received stock, sales and transfers.'},...(ownOutlet?[{id:'outlet-stock-sales',title:'Fully Paid Outlet-stock Sales',description:'Fully paid bills supplied from outlet stock, grouped by main group and subgroup.'}]:[])];
 const icons=[Calendar,CalendarRange,FileText];
 return <div className="outlet-report-menu">{sections.map(section=><section key={section.id} aria-label={section.title}><header><h3>{section.title}</h3><p>{section.description}</p></header><div className="outlet-report-periods">{reportPeriods.map(([period,label],index)=>{const Icon=icons[index];return <button type="button" key={period} onClick={()=>onOpen(section.id==='sales'?period:`${section.id}:${period}`)}><span className="outlet-report-icon"><Icon size={24}/></span><span><strong>{label} {section.id==='sales'?'Sales':section.id==='stock'?'Stock Movement':'Outlet-stock Sales'}</strong><small>{period==='daily'?'Choose a day':period==='weekly'?'Choose a week':'Choose a month'}</small></span></button>;})}</div></section>)}</div>;
}
