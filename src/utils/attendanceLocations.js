import {employeeAtOutlet} from './employeeLocations.js';
import {reportPeriodRange} from './reportPeriods.js';
export function combineAttendanceReports(results,period,date){
 const employees=[],attendance=[];
 for(const {report,outlet} of results){
  employees.push(...(report.employees || []).map(row=>employeeAtOutlet(row,outlet)));
  attendance.push(...(report.attendance || []).map(row=>employeeAtOutlet(row,outlet)));
 }
 employees.sort((a,b)=>(a.employeeName || '').localeCompare(b.employeeName || '') || a.outletId.localeCompare(b.outletId));
 attendance.sort((a,b)=>String(b.date).localeCompare(String(a.date)) || String(a.employeeName).localeCompare(String(b.employeeName)));
 const range=reportPeriodRange(period,period==='monthly'?date.slice(0,7):date,'9999-12-31');
 const presentRecords=attendance.filter(row=>row.present).length;
 return {period,selectedDate:date,startDate:range?.start,endDate:range?.end,employees,attendance,
  summary:{employeeCount:new Set(employees.map(row=>row.empId || `${row.outletId}:${row.employeeName}`)).size,attendanceRecords:attendance.length,presentRecords,absentRecords:attendance.length-presentRecords}};
}
