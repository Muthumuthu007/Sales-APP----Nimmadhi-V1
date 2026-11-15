import test from 'node:test';import assert from 'node:assert/strict';import {combineAttendanceReports} from './attendanceLocations.js';
test('combined attendance keeps outlet and selfie evidence associated without changing source reports',()=>{
 const results=[{outlet:{outletId:'NIM1',outletName:'One',locationName:'Madurai'},report:{employees:[{empId:'E',employeeName:'Employee',presentDays:1}],attendance:[{empId:'E',employeeName:'Employee',date:'2026-11-14',present:1,photoUrl:'https://example.com/private-selfie',latitude:10}]}},{outlet:{outletId:'NIM2',outletName:'Two',locationName:'Madurai'},report:{employees:[{empId:'E',employeeName:'Employee',presentDays:0}],attendance:[{empId:'E',employeeName:'Employee',date:'2026-11-13',present:0}]}}];
 const original=structuredClone(results),combined=combineAttendanceReports(results,'weekly','2026-11-14');
 assert.deepEqual(results,original);assert.equal(combined.summary.employeeCount,1);assert.equal(combined.employees.length,2);assert.equal(combined.summary.attendanceRecords,2);assert.equal(combined.summary.presentRecords,1);assert.equal(combined.summary.absentRecords,1);
 assert.equal(combined.attendance[0].outletId,'NIM1');assert.equal(combined.attendance[0].photoUrl,results[0].report.attendance[0].photoUrl);assert.equal(combined.employees[1].outletId,'NIM2');
});
test('empty selections still show the right weekly or monthly period',()=>{
 const week=combineAttendanceReports([],'weekly','2026-01-01');assert.equal(week.startDate,'2025-12-29');assert.equal(week.endDate,'2026-01-04');assert.equal(week.summary.employeeCount,0);
 const month=combineAttendanceReports([],'monthly','2024-02-20');assert.equal(month.endDate,'2024-02-29');
});
