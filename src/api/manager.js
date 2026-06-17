import api from './axios';
import axios from 'axios';

export async function fetchOrders(status) {
  const token = localStorage.getItem('token');
  const response = await axios.get(`http://127.0.0.1:8000/api/manager/orders?status=${status}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

export async function fetchAllOrders() {
  const token = localStorage.getItem('token');
  const response = await axios.get('http://127.0.0.1:8000/api/manager/orders/all', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

export async function approveOrder(orderId, payload) {
  const token = localStorage.getItem('token');
  const response = await axios.post(`http://127.0.0.1:8000/api/manager/orders/${orderId}/approve`, payload, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

export async function rejectOrder(orderId, payload) {
  const token = localStorage.getItem('token');
  const response = await axios.post(`http://127.0.0.1:8000/api/manager/orders/${orderId}/reject`, payload, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

export async function fetchLoadPlans(type) {
  const token = localStorage.getItem('token');
  const response = await axios.get(`http://127.0.0.1:8000/api/load-plans?type=${type}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

export async function dispatchLoadPlan(loadPlanId, payload) {
  const token = localStorage.getItem('token');
  const response = await axios.post(`http://127.0.0.1:8000/api/factory/loadplans/${loadPlanId}/dispatch`, payload, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}

export async function downloadLoadPlansExcel(type) {
  const token = localStorage.getItem('token');
  const endpoint = type === 'APPROVED' ? 'approved' : 'pending';
  
  const response = await axios.get(`http://127.0.0.1:8000/api/load-plans/${endpoint}/download`, {
    headers: { 'Authorization': `Bearer ${token}` },
    responseType: 'blob' // Required to parse binary Excel file securely
  });
  return response.data;
}

export async function fetchDashboardSummary() {
  const token = localStorage.getItem('token');
  const response = await axios.get(`http://127.0.0.1:8000/api/dashboard/summary`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
}
