import api from './axios';

export async function fetchOrders(status) {
  return api.get(`/manager/orders?status=${status}`);
}

export async function fetchAllOrders() {
  return api.get('/manager/orders/all');
}

export async function approveOrder(orderId, payload) {
  return api.post(`/manager/orders/${orderId}/approve`, payload);
}

export async function rejectOrder(orderId, payload) {
  return api.post(`/manager/orders/${orderId}/reject`, payload);
}

export async function fetchLoadPlans(type) {
  return api.get(`/load-plans?type=${type}`);
}

export async function dispatchLoadPlan(loadPlanId, payload) {
  return api.post(`/factory/loadplans/${loadPlanId}/dispatch`, payload);
}

export async function downloadLoadPlansExcel(type) {
  const endpoint = type === 'APPROVED' ? 'approved' : 'pending';
  return api.get(`/load-plans/${endpoint}/download`, { responseType: 'blob' });
}

export async function fetchDispatchedLoadPlans() {
  return api.get('/load-plans/dispatched');
}

export async function downloadDispatchedLoadPlansExcel() {
  return api.get('/load-plans/dispatched/download', { responseType: 'blob' });
}

export async function fetchDashboardSummary() {
  return api.get('/dashboard/summary');
}

export async function fetchOutlets() {
  return api.get('/outlets');
}

export async function fetchGodowns() { return api.get('/godowns'); }
export async function fetchGodownStock(godownId) { return api.get(`/godowns/${encodeURIComponent(godownId)}/stock`); }
export async function receiveGodownUnit(unitId) { return api.post('/godown/units/scan/receive', { unit_id: unitId }); }
export async function fetchLoadPlanFulfillment(loadPlanId, orderId) { return api.get(`/load-plans/${encodeURIComponent(loadPlanId)}/fulfillment?orderId=${encodeURIComponent(orderId)}`); }
export async function saveLoadPlanFulfillment(loadPlanId, payload) { return api.post(`/load-plans/${encodeURIComponent(loadPlanId)}/fulfillment`, payload); }
