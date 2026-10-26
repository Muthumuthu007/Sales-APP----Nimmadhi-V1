export function outletAvailableStock(rows, productId) {
 const row=rows.find(item=>String(item.productId || item.product_id)===String(productId));
 if(!row)return 0;
 const qty=Number(row.availableQty ?? (Number(row.closingQty || 0)-Number(row.reservedQty || 0)));
 return Number.isFinite(qty)?Math.max(0,qty):0;
}
