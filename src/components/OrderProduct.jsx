import React from 'react';

export default function OrderProduct({ item, name }) {
  const complimentary = Array.isArray(item?.freeItems) ? item.freeItems : [];
  return <div style={{ whiteSpace: 'normal', minWidth: '180px' }}>
    <div>{name || item?.productName || item?.productId || item?.product_id || '—'}</div>
    {item?.isFree && <small style={{ color: 'var(--color-primary)' }}>Complimentary</small>}
    {complimentary.length > 0 && <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
      <strong>Complimentary</strong>
      {complimentary.map((free, index) => <div key={`${free.product_id || free.productId}-${index}`}>{free.productName || free.product_id || free.productId} × {free.quantity}</div>)}
    </div>}
  </div>;
}
