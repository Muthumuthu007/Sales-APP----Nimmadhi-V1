export function salaryCalendar(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Select a valid salary month.');
  const [year, monthNumber] = month.split('-').map(Number);
  if (year < 1000) throw new Error('Select a valid salary year.');
  const calendarDays = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  let sundays = 0;
  for (let day = 1; day <= calendarDays; day++) {
    if (new Date(Date.UTC(year, monthNumber - 1, day)).getUTCDay() === 0) sundays++;
  }
  return { calendarDays, sundays, workingDays: calendarDays - sundays };
}

export function eligibleSundays(attendanceDays, sundays) {
  if (!Number.isInteger(attendanceDays) || attendanceDays < 0 ||
      !Number.isInteger(sundays) || sundays < 0) throw new Error('Attendance and Sundays must be non-negative whole numbers.');
  if (attendanceDays < 10) return 0;
  const excluded = attendanceDays >= 24 ? 0 : attendanceDays >= 20 ? 1 : attendanceDays >= 15 ? 2 : 3;
  return Math.max(0, sundays - excluded);
}

export function attendanceSalary(monthlySalary, workingDays, attendanceDays, sundays) {
  if (!Number.isInteger(workingDays) || workingDays <= 0) throw new Error('Working days must be a positive whole number.');
  const text = String(monthlySalary);
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Salary must be a non-negative amount with at most two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const salaryCents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  const paidSundays = eligibleSundays(attendanceDays, sundays);
  const divisor = BigInt(workingDays);
  const roundedPay = days => Number((salaryCents * BigInt(days) * 2n + divisor) / (2n * divisor)) / 100;
  const attendancePay = roundedPay(attendanceDays);
  const sundayPay = roundedPay(paidSundays);
  // Round the final combined amount once; do not multiply a rounded daily rate.
  const baseSalary = roundedPay(attendanceDays + paidSundays);
  return { dailyRate: roundedPay(1), attendanceDays, paidSundays,
    absentDays: Math.max(0, workingDays - attendanceDays),
    absenceDeduction: roundedPay(Math.max(0, workingDays - attendanceDays)),
    roundingAdjustment: Math.round((baseSalary - attendancePay - sundayPay) * 100) / 100 || 0,
    attendancePay, sundayPay, baseSalary };
}

export function travelAllowancePay(monthlyAllowance, attendanceDays) {
  return attendanceSalary(monthlyAllowance, 26, attendanceDays, 0).attendancePay;
}

export function netSalaryPay({ base = 0, travelPay = 0, ot = 0, allowances = 0, salesIncentive = 0, deductions = 0, esiPfDeduction = 0, advanceRecovery = 0 }) {
  return Math.round((Number(base) + Number(travelPay) + Number(ot) + Number(allowances) + Number(salesIncentive) - Number(deductions) - Number(esiPfDeduction) - Number(advanceRecovery)) * 100) / 100;
}
