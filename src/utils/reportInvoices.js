export function reportInvoices(rows) {
 const invoices=new Map();
 rows.forEach((row,index)=>{
  // Names and bill numbers can repeat across unrelated invoices.
  const key=JSON.stringify([row.outletId,row.saleReferenceId || row.saleId || `row-${index}`]);
  if(!invoices.has(key))invoices.set(key,{...row,invoiceKey:key,items:[],quantity:0,workOrders:[]});
  const invoice=invoices.get(key);
  invoice.items.push(row);invoice.quantity+=Number(row.quantity || 0);
  if(row.workOrderNo && !invoice.workOrders.includes(row.workOrderNo))invoice.workOrders.push(row.workOrderNo);
 });
 return [...invoices.values()];
}
