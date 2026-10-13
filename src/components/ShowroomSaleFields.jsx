import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import GroupedProductPicker from './GroupedProductPicker';
import {productionOption} from '../utils/productHierarchy';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { showroomPrice } from '../utils/showroomPricing';
import './ShowroomSaleFields.css';
export default function ShowroomSaleFields({ item, onChange, quantity }) {
  const [accessories, setAccessories] = useState([]);
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [accessoryQuantity, setAccessoryQuantity] = useState('1');
  const [loadingAccessories, setLoadingAccessories] = useState(true);
  const [accessoryError, setAccessoryError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let current = true;
    api.get('/outlet/scheme-products').then(response => {
      if (current) setAccessories(response.products || []);
    }).catch(() => { if (current) setAccessoryError('Unable to load accessory products. Please retry.'); })
      .finally(() => { if (current) setLoadingAccessories(false); });
    return () => { current = false; };
  }, [reload]);
  const addAccessory = () => {
    const product = accessories.find(accessory => accessory.productId === selectedAccessory);
    const count = Number(accessoryQuantity);
    if (!product || !Number.isSafeInteger(count) || count < 1) {
      setAccessoryError('Select an accessory and enter a positive whole quantity.'); return;
    }
    const scheme = [item.scheme.trim(), `${count} × ${product.productName}`].filter(Boolean).join(', ');
    if (scheme.length > 500) { setAccessoryError('Scheme details must fit within 500 characters.'); return; }
    onChange({ ...item, scheme }); setSelectedAccessory(''); setAccessoryQuantity('1'); setAccessoryError('');
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
    <div className="showroom-accessory-picker">
      <GroupedProductPicker label="Complimentary accessory" options={accessories.map(productionOption)} value={selectedAccessory} onChange={setSelectedAccessory} placeholder={loadingAccessories ? 'Loading Accessories…' : 'Search accessory products…'} />
      <div className="showroom-accessory-actions"><Input label="Accessory quantity" type="number" min="1" step="1" value={accessoryQuantity} onChange={event => setAccessoryQuantity(event.target.value)} /><Button variant="secondary" disabled={loadingAccessories || !selectedAccessory} onClick={addAccessory}>Add to scheme</Button></div>
      {!loadingAccessories && !accessories.length && !accessoryError && <small className="showroom-sale-hint">No products are configured in the Accessories subgroups.</small>}
      {accessoryError && <div role="alert" className="showroom-sale-hint">{accessoryError}<Button variant="secondary" onClick={() => { setLoadingAccessories(true); setAccessoryError(''); setReload(value => value + 1); }}>Reload accessories</Button></div>}
    </div>
    {field('scheme', 'Scheme / complimentary items (optional)', { placeholder: 'e.g. 2 accessories, 2 accessory covers', maxLength: 500 })}
    <small className="showroom-sale-hint">Scheme details are recorded on the invoice. Stock allocation for complimentary products follows the configured outlet offers.</small>
    <div className="showroom-price-preview">
      <div><span>Value per unit</span><strong>{price ? currency(price.value) : '—'}</strong></div>
      <div><span>Total sales value</span><strong>{price ? currency(price.totalSalesValue) : '—'}</strong></div>
      <p>Sticker MRP − discount, multiplied by quantity. Tax is included.</p>
    </div>
  </div>;
}
