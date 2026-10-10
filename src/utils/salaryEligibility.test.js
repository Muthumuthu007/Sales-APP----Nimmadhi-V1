import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salaryCalendar, eligibleSundays } from './salaryEligibility.js';
test('Sunday entitlement at every attendance threshold, for four and five Sunday months', () => {
  for (const [days, four, five] of [[0,0,0],[9,0,0],[10,1,2],[14,1,2],[15,2,3],[19,2,3],[20,3,4],[23,3,4],[24,4,5],[26,4,5]]) {
    assert.equal(eligibleSundays(days,4),four);
    assert.equal(eligibleSundays(days,5),five);
  }
});
test('salary calendar handles different month lengths and leap years', () => {
  assert.deepEqual(salaryCalendar('2026-10'), {calendarDays:31,sundays:4,workingDays:27});
  assert.deepEqual(salaryCalendar('2026-11'), {calendarDays:30,sundays:5,workingDays:25});
  assert.deepEqual(salaryCalendar('2024-02'), {calendarDays:29,sundays:4,workingDays:25});
});
test('invalid inputs do not silently calculate salary eligibility', () => {
  assert.throws(()=>eligibleSundays(-1,4));
  assert.throws(()=>eligibleSundays(10.5,4));
  assert.throws(()=>salaryCalendar('2026-13'));
});

test('absences reduce monthly salary and eligible Sundays add paid days', async () => {
  const { attendanceSalary } = await import('./salaryEligibility.js');
  assert.deepEqual(attendanceSalary('30000',26,24,4), {
    dailyRate:1153.85,attendanceDays:24,paidSundays:4,absentDays:2,
    attendancePay:27692.31,sundayPay:4615.38,baseSalary:32307.69,absenceDeduction:2307.69,roundingAdjustment:0,
  });
  assert.equal(attendanceSalary('30000',26,26,4).baseSalary,34615.38);
  assert.equal(attendanceSalary('30000',26,23,4).baseSalary,30000);
  assert.equal(attendanceSalary('30000',26,0,4).baseSalary,0);
});

test('salary retains fractional precision until final payment', async () => {
  const { attendanceSalary } = await import('./salaryEligibility.js');
  assert.equal(attendanceSalary('30000',26,10,4).baseSalary,12692.31);
  assert.equal(attendanceSalary('30000',26,14,4).roundingAdjustment,-0.01);
  assert.equal(attendanceSalary('30000',25,24,5).baseSalary,34800);
  assert.throws(()=>attendanceSalary('30000',0,24,4));
});

test('travel allowance pays only actual attendance, without Sunday bonus', async () => {
  const { travelAllowancePay } = await import('./salaryEligibility.js');
  assert.equal(travelAllowancePay('2600',26),2600);
  assert.equal(travelAllowancePay('2600',24),2400);
  assert.equal(travelAllowancePay('3000',24),2769.23);
  assert.equal(travelAllowancePay('2600',0),0);
  assert.equal(travelAllowancePay(0,24),0);
});

import { netSalaryPay, attendanceSalary, travelAllowancePay } from './salaryEligibility.js';
test('ESI and PF is deducted once as a fixed monthly amount regardless of attendance', () => {
  for (const days of [9, 24, 26]) {
    const base = attendanceSalary(30000, 26, days, 4).baseSalary;
    const travelPay = travelAllowancePay(2600, days);
    assert.equal(netSalaryPay({base, travelPay, esiPfDeduction: 1020}), Math.round((base + travelPay - 1020) * 100) / 100);
  }
  assert.equal(netSalaryPay({base:8000, esiPfDeduction:1020}),6980);
  assert.equal(netSalaryPay({base:34707.69, esiPfDeduction:1403, deductions:100}),33204.69);
  assert.equal(netSalaryPay({base:8000}),8000);
});

test('manual October advance recovery reduces salary only in that month', () => {
  assert.equal(netSalaryPay({base:30000,advanceRecovery:5000}),25000);
  assert.equal(netSalaryPay({base:30000,advanceRecovery:0}),30000);
});
