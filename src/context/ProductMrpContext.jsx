import React,{createContext,useContext,useEffect,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {AuthContext} from './AuthContext';
import api from '../api/axios';
import {productionOption} from '../utils/productHierarchy';
import {startCatalogueRefresh} from '../utils/catalogueRefresh';
// eslint-disable-next-line react-refresh/only-export-components
export const ProductMrpContext=createContext({prices:{},catalogue:[],loading:false,error:false});
// eslint-disable-next-line react-refresh/only-export-components
export const MrpColumnContext=createContext(false);
export function ProductMrpProvider({children}) {
 const {token,outletId}=useContext(AuthContext);
 const {pathname,search}=useLocation();
 const scopeKey=`${token || ''}:${outletId || ''}`;
 const [state,setState]=useState({scopeKey:null,prices:{},catalogue:[],loading:false,error:false});
 useEffect(()=>{
  if(!token)return;
  return startCatalogueRefresh({
   load:()=>api.get('/products'),
   onData:data=>setState(previous=>{
    const next={scopeKey,prices:Object.fromEntries((data.products || []).map(p=>[p.product_id,p.mrpSticker])),catalogue:(data.products || []).map(productionOption),loading:false,error:false};
    return JSON.stringify(previous)===JSON.stringify(next)?previous:next;
   }),
   onError:()=>setState({scopeKey,prices:{},catalogue:[],loading:false,error:true})
  });
 },[token,outletId,scopeKey,pathname,search]);
 return <ProductMrpContext.Provider value={state.scopeKey===scopeKey?state:{prices:{},catalogue:[],loading:Boolean(token),error:false}}>{children}</ProductMrpContext.Provider>;
}
