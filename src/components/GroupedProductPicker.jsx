import './GroupedProductPicker.css';
import React,{useMemo,useState} from 'react';
import {Select} from './ui/Input';
import {SearchableSelect} from './ui/SearchableSelect';
import {groupedProductOptions} from '../utils/productHierarchy';
export default function GroupedProductPicker({options,value,onChange,label='Product',placeholder,disabled=false,searchAll=false,searchFirst=true}){
 const categories=useMemo(()=>groupedProductOptions(options),[options]);
 const [chosenMain,setMain]=useState(''),[chosenGroup,setGroup]=useState('');
 const selected=options.find(option=>option.value===value&&value);
 const main=selected?.mainGroupName || (categories.some(item=>item.name===chosenMain)?chosenMain:(searchAll?'':categories[0]?.name) || '');
 const groups=categories.find(item=>item.name===main)?.groups || [];
 const selectedGroup=selected && (selected.groupId || selected.group || 'Ungrouped');
 const group=selectedGroup || (groups.some(item=>item.id===chosenGroup)?chosenGroup:(searchAll?'':groups[0]?.id) || '');
 const available=searchAll && !group ? (main?groups.flatMap(item=>item.options):options.filter(item=>item.value)) : groups.find(item=>item.id===group)?.options || [];
 const choice=<div className="grouped-product-choice">{disabled?<span>{options.find(item=>item.value===value)?.label || 'No product selected'}</span>:<SearchableSelect label={label} options={available} value={value} onChange={onChange} placeholder={placeholder || 'Search products in this subgroup…'}/>}</div>;
 return <div className="grouped-product-picker"><div className={`grouped-product-fields${searchAll&&searchFirst?' sales-search-first':''}`}>
 {searchAll && searchFirst && choice}
 <Select label={searchAll&&searchFirst?'Filter main group (optional)':`${label} main group`} value={main} disabled={disabled||!categories.length} onChange={e=>{setMain(e.target.value);setGroup('');onChange('');}} options={[...(searchAll?[{value:'',label:'All groups'}]:[]),...categories.map(item=>({value:item.name,label:item.name}))]}/>
 <Select label={searchAll&&searchFirst?'Filter subgroup (optional)':`${label} subgroup`} value={group} disabled={disabled||!groups.length} onChange={e=>{setGroup(e.target.value);onChange('');}} options={[...(searchAll?[{value:'',label:'All subgroups'}]:[]),...groups.map(item=>({value:item.id,label:item.label}))]}/>
 {(!searchAll || !searchFirst) && choice}
 </div>{group && <p className="grouped-product-path">{groups.find(item=>item.id===group)?.label}</p>}</div>;
}
