import api from './axios';

export const fetchOutletOffers = (outletId, ruleType) => api.get('/manager/outlet-offers', { params: { outletId, ruleType } });
export const saveOutletOffer = (payload) => api.post('/manager/outlet-offers', payload);
export const deleteOutletOffer = (outletId, offerId) => api.delete(`/manager/outlet-offers/${encodeURIComponent(offerId)}`, { params: { outletId } });
export const fetchActiveOutletOffers = () => api.get('/outlet/offers');
