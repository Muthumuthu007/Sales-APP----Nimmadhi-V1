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

export async function fetchDashboardSummary() {
  return api.get('/dashboard/summary');
}
