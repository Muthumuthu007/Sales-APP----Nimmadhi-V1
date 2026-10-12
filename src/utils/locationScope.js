export const UNASSIGNED_LOCATION = '__UNASSIGNED__';
export const outletLocation = outlet => String(outlet.locationName || '').trim();
export function locationOptions(outlets) {
  const names = new Map();
  for (const outlet of outlets) {
    const name = outletLocation(outlet);
    if (name && !names.has(name.toLocaleLowerCase())) names.set(name.toLocaleLowerCase(), name);
  }
  return [{value:'',label:'All locations'},...Array.from(names.values()).sort((a,b)=>a.localeCompare(b)).map(name=>({value:name.toLocaleLowerCase(),label:name})),
    ...(outlets.some(outlet=>!outletLocation(outlet)) ? [{value:UNASSIGNED_LOCATION,label:'Unassigned'}] : [])];
}
