export function splitAllocation(rows, index, id) {
 const row=rows[index], quantity=Number(row?.quantity);
 if(!row || !Number.isSafeInteger(quantity) || quantity<2) return rows;
 const next={...row,id,quantity:Math.floor(quantity/2),sourceType:row.sourceType==='FACTORY'?'GODOWN':'FACTORY',sourceLocationId:row.sourceType==='FACTORY'?'':'FACTORY'};
 return rows.flatMap((item,i)=>i===index?[{...item,quantity:Math.ceil(quantity/2)},next]:[item]);
}
export function allocationPayload(items, rows) {
 const required=new Map(), totals=new Map(), merged=new Map();
 for(const item of items) required.set(item.productId,(required.get(item.productId)||0)+Number(item.quantity));
 for(const row of rows){
  const quantity=Number(row.quantity);
  if(row.quantity==='' || typeof row.quantity==='boolean' || !Number.isSafeInteger(quantity)||quantity<1) return {error:'Enter a positive whole quantity for every source.'};
  if(!required.has(row.productId))return {error:'An assigned product does not belong to this load plan.'};
  if(!['FACTORY','GODOWN'].includes(row.sourceType))return {error:'Choose Factory or Godown for every source.'};
  if(row.sourceType==='GODOWN'&&(!row.sourceLocationId||row.sourceLocationId==='FACTORY'))return {error:'Select a godown for every Godown source.'};
  totals.set(row.productId,(totals.get(row.productId)||0)+quantity);
  const sourceLocationId=row.sourceType==='FACTORY'?'FACTORY':row.sourceLocationId;
  const key=JSON.stringify([row.productId,row.sourceType,sourceLocationId]);
  if(merged.has(key))merged.get(key).quantity+=quantity;
  else merged.set(key,{productId:row.productId,quantity,sourceType:row.sourceType,...(row.sourceType==='GODOWN'?{sourceLocationId}: {})});
 }
 for(const [id,count] of required){
  if(totals.get(id)!==count){const item=items.find(product=>product.productId===id);return {error:`${item?.productName||id}: assigned ${totals.get(id)||0} of ${count}. Source quantities must equal the approved quantity.`};}
 }
 return {allocations:[...merged.values()]};
}
