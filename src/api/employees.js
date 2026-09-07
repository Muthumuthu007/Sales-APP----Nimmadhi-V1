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
  return api.post('/outlet/employees/list', { outletId });
}
