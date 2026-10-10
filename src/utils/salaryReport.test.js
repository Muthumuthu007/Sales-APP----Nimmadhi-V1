import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salaryReportCsv } from './salaryReport.js';
test('salary report exports recorded payroll values and sums payable with monthly advance balances', () => {
  const csv = salaryReportCsv([
    {empId:'E1',name:'Employee, One',salaryModel:'MONTHLY',basicSalary:30000,presentDays:24,paidSundays:4,baseSalary:32307.69,esiPfDeduction:1020,travelPay:2400,netSalary:33687.69},
    {empId:'E2',name:'=unsafe',salaryModel:'DAILY',perDayRate:500,presentDays:16,baseSalary:8000,esiPfDeduction:1020,netSalary:6980},
  ],'2026-10','Outlet');
  assert.ok(csv.includes('"Employee, One"'));
  assert.ok(csv.includes('"\'=unsafe"'));
  assert.ok(csv.includes('"40667.69"'));
  assert.ok(csv.includes('"2040"'));
  assert.ok(csv.includes('"2026-10"'));
  assert.ok(csv.includes('Previous advance'));
});

test('report includes September advance carried into October and manual recovery', () => {
  const csv = salaryReportCsv([{name:'Employee A',previousAdvance:10000,advanceReceived:0,advanceRecovery:5000,advanceBalance:5000,outstandingAdvance:5000,netSalary:25000}], '2026-10', 'Outlet');
  assert.ok(csv.includes('"Recovered from this salary month"'));
  assert.ok(csv.includes('"10000","0","10000","5000","5000","5000","25000"'));
});
