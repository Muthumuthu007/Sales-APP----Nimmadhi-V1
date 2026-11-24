// One request at a time; ignore responses after logout, scope change or unmount.
export function startCatalogueRefresh({load,onData,onError,win=window,doc=document,intervalMs=60000}) {
 let active=true,inFlight=false;
 const refresh=async()=>{
  if(!active || inFlight || doc.visibilityState==='hidden')return;
  inFlight=true;
  try {const result=await load();if(active)onData(result);}
  catch(error){if(active)onError(error);}
  finally {inFlight=false;}
 };
 const timer=win.setInterval(refresh,intervalMs);
 win.addEventListener('focus',refresh);doc.addEventListener('visibilitychange',refresh);
 void refresh();
 return()=>{active=false;win.clearInterval(timer);win.removeEventListener('focus',refresh);doc.removeEventListener('visibilitychange',refresh);};
}

export function refreshOptionPrices(options,catalogue) {
 const byId=new Map(catalogue.map(option=>[String(option.value),option]));
 return options.map(option=>{
  const current=byId.get(String(option.value));
  return current?{...option,mrpSticker:current.mrpSticker}:option;
 });
}
