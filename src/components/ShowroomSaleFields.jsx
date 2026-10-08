import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { SearchableSelect } from './ui/SearchableSelect';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { showroomPrice } from '../utils/showroomPricing';
import './ShowroomSaleFields.css';
export default function ShowroomSaleFields({ item, onChange, quantity }) {
  const [pillows, setPillows] = useState([]);
  const [selectedPillow, setSelectedPillow] = useState('');
  const [pillowQuantity, setPillowQuantity] = useState('1');
  const [loadingPillows, setLoadingPillows] = useState(true);
  const [pillowError, setPillowError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let current = true;
    api.get('/outlet/scheme-products').then(response => {
      if (current) setPillows(response.products || []);
    }).catch(() => { if (current) setPillowError('Unable to load pillow products. Please retry.'); })
      .finally(() => { if (current) setLoadingPillows(false); });
    return () => { current = false; };
  }, [reload]);
  const addPillow = () => {
    const product = pillows.find(pillow => pillow.productId === selectedPillow);
    const count = Number(pillowQuantity);
    if (!product || !Number.isSafeInteger(count) || count < 1) {
      setPillowError('Select a pillow and enter a positive whole quantity.'); return;
    }
    const scheme = [item.scheme.trim(), `${count} × ${product.productName}`].filter(Boolean).join(', ');
    if (scheme.length > 500) { setPillowError('Scheme details must fit within 500 characters.'); return; }
    onChange({ ...item, scheme }); setSelectedPillow(''); setPillowQuantity('1'); setPillowError('');
  };
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
    <div className="showroom-pillow-picker">
      <SearchableSelect label="Complimentary pillow from production" options={pillows.map(pillow => ({value:pillow.productId,label:pillow.productName,group:pillow.groupName}))} value={selectedPillow} onChange={setSelectedPillow} placeholder={loadingPillows ? 'Loading pillow products…' : 'Search pillow products…'} />
      <div className="showroom-pillow-actions"><Input label="Pillow quantity" type="number" min="1" step="1" value={pillowQuantity} onChange={event => setPillowQuantity(event.target.value)} /><Button variant="secondary" disabled={loadingPillows || !selectedPillow} onClick={addPillow}>Add to scheme</Button></div>
      {!loadingPillows && !pillows.length && !pillowError && <small className="showroom-sale-hint">No products are configured in the production pillow groups.</small>}
      {pillowError && <div role="alert" className="showroom-sale-hint">{pillowError}<Button variant="secondary" onClick={() => { setLoadingPillows(true); setPillowError(''); setReload(value => value + 1); }}>Reload pillows</Button></div>}
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
