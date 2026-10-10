import api from './axios';

/**
 * Fetches all employees for a given outlet ID.
 * @param {string} outletId
 */
export async function fetchOutletEmployees(outletId) {
  return api.post('/outlet/employees/list', { outletId });
}

/**
 * Registers a new employee for the outlet.
 * @param {object} employeeData
 */
export async function createOutletEmployee(employeeData) {
  return api.post(`/outlet/employees`, employeeData);
}

/**
 * Updates the salary configuration of an employee.
 * @param {string} empId
 * @param {object} salaryData
 */
export async function updateEmployeeSalary(empId, salaryData) {
  return api.patch(`/outlet/employees/${empId}/salary`, salaryData);
}

/**
 * Fetches all employees with their salaries for a given outlet ID.
 * @param {string} outletId
 */
export async function fetchEmployeesWithSalary(outletId) {
  return api.post('/manager/employees/list', { outletId });
}

export async function fetchManagerEmployees(outletId) {
  return api.post('/manager/employees/list', { outletId });
}

export async function createManagerEmployee(employeeData) {
  return api.post('/manager/employees', employeeData);
}

export async function fetchOutlets() {
  return api.get('/outlets');
}

export async function createOutlet(outletData) {
  return api.post('/outlets/create', outletData);
}

export async function fetchProductGroups() {
  return api.get('/product-groups');
}

export async function deleteOutlet(outletId) {
  return api.delete(`/outlets/${encodeURIComponent(outletId)}`);
}

export async function fetchOutletIncentives(outletId, month) {
  return api.get('/manager/incentives', { params: { outletId, month } });
}

export async function fetchManagerAttendance(outletId, period, date) {
  return api.get('/manager/attendance', { params: { outletId, period, date } });
}

export async function reassignEmployee(empId, fromOutletId, toOutletId) {
  return api.post(`/manager/employees/${encodeURIComponent(empId)}/reassign`, { fromOutletId, toOutletId });
}

export async function fetchOutletProductGroups(outletId) {
  return api.get(`/manager/outlets/${encodeURIComponent(outletId)}/product-groups`);
}

export async function assignOutletProductGroups(outletId, groupIds) {
  return api.post(`/manager/outlets/${encodeURIComponent(outletId)}/product-groups`, { groupIds });
}

export async function fetchEmployeeAdvances(empId, outletId, month) {
  return api.get(`/manager/employees/${encodeURIComponent(empId)}/advances`, { params: { outletId, month } });
}
export async function recordEmployeeAdvance(empId, data) {
  return api.post(`/manager/employees/${encodeURIComponent(empId)}/advances`, data);
}
