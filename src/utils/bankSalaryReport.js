const escapeXml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export function bankSalaryReportXml(rows, month, outlet) {
  rows = rows.filter(employee => employee.salaryPaymentMethod !== 'CASH');
  const cell = (value, type = 'String', style = '') => `<Cell${style ? ` ss:StyleID="${style}"` : ''}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
  const row = cells => `<Row>${cells.join('')}</Row>`;
  const total = Math.round(rows.reduce((sum, employee) => sum + Number(employee.netSalary || 0), 0) * 100) / 100;
  const records = rows.map(employee => row([
    cell(employee.name || employee.employeeName || employee.empName || 'Unnamed'),
    cell(employee.bankAccountNumber), cell(employee.ifscCode), cell(employee.bankName), cell(employee.bankBranch),
    cell(Number(employee.netSalary || 0).toFixed(2), 'Number', 'Money'),
  ]));
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#FFF2CC" ss:Pattern="Solid"/></Style><Style ss:ID="Money"><NumberFormat ss:Format="0.00"/></Style></Styles>
<Worksheet ss:Name="Bank Salary Report"><Table>
<Column ss:Width="160"/><Column ss:Width="150"/><Column ss:Width="110"/><Column ss:Width="150"/><Column ss:Width="180"/><Column ss:Width="100"/>
${row([cell('Nimmadhi bank salary report'),cell(outlet),cell(month)])}
${row(['EMPLOYEE','A/C NO','IFSC CODE','BANK','BRANCH','AMT'].map(label => cell(label,'String','Header')))}
${records.join('\n')}
${row([cell('TOTAL'),cell(''),cell(''),cell(''),cell(''),cell(total.toFixed(2),'Number','Money')])}
</Table></Worksheet></Workbook>`;
}
