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

export async function fetchDispatchHistory() {
  return api.get('/dispatch-history');
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
export async function fetchGodownFulfillments() { return api.get('/godown/fulfillments'); }
export async function dispatchGodownUnit(line, unitId) { return api.post(`/godown/fulfillments/${encodeURIComponent(line.orderId)}/${encodeURIComponent(line.loadPlanId)}/${encodeURIComponent(line.lineId)}/units/scan/dispatch`, { unit_id: unitId }); }
export async function fetchLoadPlanFulfillment(loadPlanId, orderId) { return api.get(`/load-plans/${encodeURIComponent(loadPlanId)}/fulfillment?orderId=${encodeURIComponent(orderId)}`); }
export async function saveLoadPlanFulfillment(loadPlanId, payload) { return api.post(`/load-plans/${encodeURIComponent(loadPlanId)}/fulfillment`, payload); }
export async function fetchDispatchPlans({ sourceType = 'ALL', godownId = '', pendingOnly = false, includeDispatched = false } = {}) {
  const params = new URLSearchParams({ sourceType });
  if (godownId) params.set('godownId', godownId);
  if (pendingOnly) params.set('pendingOnly', 'true');
  if (includeDispatched) params.set('includeDispatched', 'true');
  return api.get(`/dispatch-plans?${params.toString()}`);
}
export async function manuallyDispatchFulfillment(line, quantity, pendingOnly = false) {
  return api.post(`/dispatch-plans/${encodeURIComponent(line.orderId)}/${encodeURIComponent(line.loadPlanId)}/${encodeURIComponent(line.lineId)}/dispatch`, { quantity, dispatchOrigin: pendingOnly ? 'PENDING' : 'ORIGINAL' });
}

export async function undoLoadPlan(plan, action) {
  return api.post(`/load-plans/${encodeURIComponent(plan.loadPlanId)}/undo`, { orderId: plan.orderId, action, ...(plan.lineId ? { lineId: plan.lineId } : {}) });
}

export async function fetchOutletStockForApproval(outletId) {
  return api.get(`/manager/outlets/${encodeURIComponent(outletId)}/stock`);
}
