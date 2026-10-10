const columns = [
  ['S.No', (_, index) => index + 1], ['Employee ID', row => row.empId],
  ['Name', row => row.name || row.employeeName || row.empName || 'Unnamed'],
  ['Salary model', row => row.salaryModel],
  ['Monthly salary / daily rate', row => row.salaryModel === 'MONTHLY' ? row.basicSalary : row.perDayRate],
  ['Working days divisor', () => 26], ['Attendance days', row => row.presentDays],
  ['Paid Sundays', row => row.paidSundays], ['Attendance pay', row => row.attendancePay],
  ['Sunday pay', row => row.sundayPay], ['Salary earned', row => row.baseSalary],
  ['ESI & PF', row => row.esiPfDeduction], ['Sales incentive', row => row.salesIncentive],
  ['Travel allowance paid', row => row.travelPay], ['Other allowances', row => row.allowances],
  ['OT pay', row => row.otPay], ['Other deductions', row => row.deductions],
  ['Previous advance', row => row.previousAdvance], ['Advance received', row => row.advanceReceived],
  ['Total advance for month', row => Number(row.previousAdvance || 0) + Number(row.advanceReceived || 0)],
  ['Recovered from this salary month', row => row.advanceRecovery], ['Advance balance after month', row => row.advanceBalance],
  ['Current outstanding advance', row => row.outstandingAdvance],
  ['Salary payable', row => row.netSalary],
];
const quote = value => {
  let text = String(value ?? '');
  if (/^[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
};
export function salaryReportCsv(rows, month, outlet) {
  const totals = columns.map((_, index) => index === 2 ? 'TOTAL' : index >= 6 ?
    Math.round(rows.reduce((sum, row) => sum + Number(columns[index][1](row) || 0), 0) * 100) / 100 : '');
  return '\ufeff' + [
    ['Nimmadhi salary report', month, outlet],
    ['Policy', 'Fixed 26-day divisor; travel paid for actual attendance; ESI & PF fixed monthly'],
    columns.map(([label]) => label),
    ...rows.map((row, index) => columns.map(([, read]) => read(row, index))),
    totals,
  ].map(row => row.map(quote).join(',')).join('\r\n');
}
