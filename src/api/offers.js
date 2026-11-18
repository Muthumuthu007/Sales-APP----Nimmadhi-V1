import api from './axios';

export const fetchOutletOffers = (outletId, ruleType) => api.get('/manager/outlet-offers', { params: { outletId, ruleType } });
export const saveOutletOffer = (payload) => api.post('/manager/outlet-offers', payload);
export const deleteOutletOffer = (outletId, offerId) => api.delete(`/manager/outlet-offers/${encodeURIComponent(offerId)}`, { params: { outletId } });
export const fetchActiveOutletOffers = () => api.get('/outlet/offers');

export const copyOutletOffers = payload => api.post('/manager/outlet-offers/copy', payload,{timeout:120000});

export const saveComplimentaryBundle = payload => api.post('/manager/outlet-offers/bundle', payload);
export const fetchSizeComplimentaryMappings=()=>api.get('/manager/size-complimentary-mappings');
export const saveSizeComplimentaryMappings=payload=>api.post('/manager/size-complimentary-mappings',payload);

export const startComplimentaryCopyJob=payload=>api.post('/manager/outlet-offers/copy-jobs',payload,{timeout:120000});
export const fetchComplimentaryCopyJobs=()=>api.get('/manager/outlet-offers/copy-jobs');
export const fetchComplimentaryCopyJob=id=>api.get(`/manager/outlet-offers/copy-jobs/${encodeURIComponent(id)}`);
export const retryComplimentaryCopyJob=id=>api.post(`/manager/outlet-offers/copy-jobs/${encodeURIComponent(id)}`,{});
