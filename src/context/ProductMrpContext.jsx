import React,{createContext,useContext,useEffect,useState} from 'react';
import {AuthContext} from './AuthContext';
import api from '../api/axios';
// eslint-disable-next-line react-refresh/only-export-components
export const ProductMrpContext=createContext({prices:{},loading:false,error:false});
// eslint-disable-next-line react-refresh/only-export-components
export const MrpColumnContext=createContext(false);
export function ProductMrpProvider({children}) {
 const {token,outletId}=useContext(AuthContext);
 const scopeKey=`${token || ''}:${outletId || ''}`;
 const [state,setState]=useState({scopeKey:null,prices:{},loading:false,error:false});
 useEffect(()=>{let active=true;
 if(token)api.get('/products').then(data=>{if(active)setState({scopeKey,prices:Object.fromEntries((data.products || []).map(p=>[p.product_id,p.mrpSticker])),loading:false,error:false});}).catch(()=>{if(active)setState({scopeKey,prices:{},loading:false,error:true});});
 return()=>{active=false;};},[token,outletId,scopeKey]);
 return <ProductMrpContext.Provider value={state.scopeKey===scopeKey?state:{prices:{},loading:Boolean(token),error:false}}>{children}</ProductMrpContext.Provider>;
}
