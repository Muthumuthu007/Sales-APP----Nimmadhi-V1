import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import api from '../api/axios';
import {AuthContext} from './AuthContext';
import {Select} from '../components/ui/Input';
import {locationOptions} from '../utils/locationScope';
// Context and hook deliberately share this small module.
// eslint-disable-next-line react-refresh/only-export-components
export const LocationContext=createContext({refreshLocations:async()=>{}});
// eslint-disable-next-line react-refresh/only-export-components
export const useManagerLocation=()=>useContext(LocationContext);
export function LocationProvider({children}) {
  const {role}=useContext(AuthContext);
  const [location,setLocation]=useState(()=>sessionStorage.getItem('managerLocationFilter') || '');
  const [outlets,setOutlets]=useState([]), [ready,setReady]=useState(false), [error,setError]=useState('');
  const refreshLocations=useCallback(async()=>{
    try {const response=await api.get('/outlets',{ignoreLocationScope:true});setOutlets(response.outlets || []);setError('');setReady(true);}
    catch {setError('Unable to load location filters. Refresh to try again.');}
  },[]);
  useEffect(()=>{
    if(role!=='MANAGER') return;
    let active=true;
    api.get('/outlets',{ignoreLocationScope:true}).then(response=>{if(active){setOutlets(response.outlets || []);setReady(true);setError('');}}).catch(()=>{if(active)setError('Unable to load location filters. Refresh to try again.');});
    return ()=>{active=false;};
  },[role]);
  const changeLocation=event=>{
    const value=event.target.value;
    sessionStorage.setItem('managerLocationFilter',value);
    sessionStorage.removeItem('managerLogisticsOutletId');
    setLocation(value);
  };
  if(role!=='MANAGER') return children;
  return <LocationContext.Provider value={{location,refreshLocations}}>
    <div style={{display:'flex',alignItems:'end',gap:'1rem',flexWrap:'wrap',marginBottom:'1.25rem'}}>
      <div style={{minWidth:'240px'}}><Select label="Location" value={location} onChange={changeLocation} options={locationOptions(outlets)} disabled={!ready} /></div>
      <p style={{margin:0,paddingBottom:'0.75rem'}}>Outlets and results are limited to the selected location.</p>
    </div>
    {error ? <p role="alert">{error}<button onClick={refreshLocations}>Retry</button></p> : ready ? <React.Fragment key={location}>{children}</React.Fragment> : <p>Loading locations…</p>}
  </LocationContext.Provider>;
}
