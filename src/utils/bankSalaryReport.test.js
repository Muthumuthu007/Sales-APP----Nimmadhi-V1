import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bankSalaryReportXml} from './bankSalaryReport.js';
test('bank report keeps accounts as text, uses net salary and includes outlet month and totals', () => {
  const xml = bankSalaryReportXml([
    {name:'Employee A',bankAccountNumber:'004770110191316',ifscCode:'UCBA0000477',bankName:'Bank & Co',bankBranch:'Chennai',netSalary:25000},
    {name:'Employee B',bankAccountNumber:'131001000023373',ifscCode:'IOBA0001310',netSalary:6980},
  ],'2026-10','Madurai');
  assert.ok(xml.includes('<Data ss:Type="String">004770110191316</Data>'));
  assert.ok(xml.includes('Bank &amp; Co'));
  assert.ok(xml.includes('<Data ss:Type="Number">31980.00</Data>'));
  assert.ok(xml.includes('Madurai'));assert.ok(xml.includes('2026-10'));
  assert.ok(xml.includes('25000.00'));assert.ok(xml.includes('IFSC CODE'));
});
test('bank report escapes customer text and leaves missing bank fields blank without dropping employees', () => {
  const xml = bankSalaryReportXml([{name:'<Employee>',netSalary:1000}],'2026-10','Outlet');
  assert.ok(xml.includes('&lt;Employee&gt;'));assert.ok(xml.includes('1000.00'));
  assert.ok(!xml.includes('undefined'));
});

test('cash salaries are excluded from bank payment export', () => {
 const xml=bankSalaryReportXml([{name:'Cash employee',salaryPaymentMethod:'CASH',netSalary:10000},{name:'Bank employee',salaryPaymentMethod:'BANK',netSalary:20000}], '2026-10','Outlet');
 assert.ok(!xml.includes('Cash employee'));
 assert.ok(xml.includes('Bank employee'));
 assert.ok(xml.includes('20000.00'));
 assert.ok(!xml.includes('30000.00'));
});
