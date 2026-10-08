const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const amount = value => value == null ? '' : Number(value).toFixed(2);
export function showroomReportCsv(rows) {
 const headers = ['Workorder No','Bill No.','Dispatch date','Party name','Address','Ph No','Brand','Model','Colour','Size','Qty','MRP Sticker','Discount %','Value','Total Sales value','Grand Total','Scheme','Tax (included)','ID Name'];
 const invoices = new Set();
 return [headers.map(cell).join(','), ...rows.map(row => {
  const key = row.saleReferenceId || row.saleId;
  const grand = invoices.has(key) ? '' : amount(row.billAmount);
  invoices.add(key);
  return [row.workOrderNo,row.billNo,row.dispatchDate,row.customerName,row.customerAddress,row.customerPhone,row.brand,row.model || row.productName,row.colour,row.size,row.quantity,amount(row.mrpSticker),row.discountPercent == null ? '' : `${row.discountPercent}%`,amount(row.value ?? row.price),amount(row.totalSalesValue ?? row.totalAmount),grand,row.scheme,row.taxPercent == null ? '' : `${row.taxPercent}%`,row.createdByName].map(cell).join(',');
 })].join('\r\n');
}
