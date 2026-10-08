import React from 'react';
import { Input } from './ui/Input';
import { showroomPrice } from '../utils/showroomPricing';
import './ShowroomSaleFields.css';
export default function ShowroomSaleFields({ item, onChange, quantity }) {
  const field = (key, label, props = {}) => <Input label={label} value={item[key]} onChange={event => onChange({ ...item, [key]: event.target.value })} {...props} />;
  const price = showroomPrice({ ...item, quantity });
  const currency = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  return <div className="showroom-sale-fields">
    <div className="showroom-sale-grid">
      {field('brand', 'Brand', { maxLength: 80 })}{field('model', 'Model', { maxLength: 200 })}
      {field('colour', 'Colour', { placeholder: 'e.g. Red', maxLength: 80 })}{field('size', 'Size (inches)', { placeholder: 'e.g. 78 × 84 × 6', maxLength: 80 })}
      {field('mrpSticker', 'Sticker MRP per unit (₹)', { type: 'number', min: '0.01', step: '0.01' })}
      {field('discountPercent', 'Discount (%)', { type: 'number', min: '0', max: '99.99', step: '0.01' })}
      {field('taxPercent', 'Included tax (%)', { type: 'number', min: '0', max: '100', step: '0.01' })}
    </div>
    {field('scheme', 'Scheme / complimentary items (optional)', { placeholder: 'e.g. 2 pillows, 2 pillow covers', maxLength: 500 })}
    <small className="showroom-sale-hint">Scheme details are recorded on the invoice. Stock allocation for complimentary products follows the configured outlet offers.</small>
    <div className="showroom-price-preview">
      <div><span>Value per unit</span><strong>{price ? currency(price.value) : '—'}</strong></div>
      <div><span>Total sales value</span><strong>{price ? currency(price.totalSalesValue) : '—'}</strong></div>
      <p>Sticker MRP − discount, multiplied by quantity. Tax is included.</p>
    </div>
  </div>;
}
