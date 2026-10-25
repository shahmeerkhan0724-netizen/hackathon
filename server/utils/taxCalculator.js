/**
 * Tax Calculator for HCM Lite Hackathon
 *
 * Slabs based on annual gross income:
 * Slab 1: Up to 600,000                     -> 0%
 * Slab 2: 600,001 to 1,200,000             -> 5% of amount above 600,000
 * Slab 3: 1,200,001 to 2,400,000           -> 30,000 + 15% of amount above 1,200,000
 * Slab 4: 2,400,001 to 3,600,000           -> 210,000 + 25% of amount above 2,400,000
 * Slab 5: Above 3,600,000                  -> 510,000 + 35% of amount above 3,600,000
 */

/**
 * Calculates annual income tax based on annualized taxable gross salary.
 * @param {number} annualGross
 * @returns {number} annualTax (rounded to 2 decimal places or integer)
 */
export const calculateAnnualTax = (annualGross) => {
  const gross = Math.max(0, Number(annualGross) || 0);

  if (gross <= 600000) {
    return 0;
  }

  if (gross <= 1200000) {
    const taxable = gross - 600000;
    return Math.round(taxable * 0.05 * 100) / 100;
  }

  if (gross <= 2400000) {
    const taxable = gross - 1200000;
    return Math.round((30000 + taxable * 0.15) * 100) / 100;
  }

  if (gross <= 3600000) {
    const taxable = gross - 2400000;
    return Math.round((210000 + taxable * 0.25) * 100) / 100;
  }

  const taxable = gross - 3600000;
  return Math.round((510000 + taxable * 0.35) * 100) / 100;
};

/**
 * Calculates monthly tax deduction from annualized taxable gross.
 * @param {number} annualGross
 * @returns {number} monthlyTax (rounded to nearest integer)
 */
export const calculateMonthlyTax = (annualGross) => {
  const annualTax = calculateAnnualTax(annualGross);
  return Math.round(annualTax / 12);
};

/**
 * Calculates salary breakdown from monthly basic salary.
 * Follows brief specification:
 * - HRA = 40% of basic
 * - Medical = 10% of basic
 * - Gross = 1.5 * basic (basic + hra + medical)
 * @param {number} basicSalary
 * @param {number} otherAllowances
 * @returns {{ basicSalary: number, hra: number, medicalAllowance: number, otherAllowances: number, grossSalary: number, annualGross: number, annualTax: number, monthlyTax: number, netMonthlySalary: number }}
 */
export const calculateSalaryBreakdown = (basicSalary, otherAllowances = 0) => {
  const basic = Math.max(0, Math.round(Number(basicSalary) || 0));
  const hra = Math.round(basic * 0.4);
  const medical = Math.round(basic * 0.1);
  const others = Math.max(0, Math.round(Number(otherAllowances) || 0));
  const grossSalary = basic + hra + medical + others;

  const annualGross = grossSalary * 12;
  const annualTax = calculateAnnualTax(annualGross);
  const monthlyTax = calculateMonthlyTax(annualGross);
  const netMonthlySalary = grossSalary - monthlyTax;

  return {
    basicSalary: basic,
    hra,
    medicalAllowance: medical,
    otherAllowances: others,
    grossSalary,
    annualGross,
    annualTax,
    monthlyTax,
    netMonthlySalary,
  };
};

export default {
  calculateAnnualTax,
  calculateMonthlyTax,
  calculateSalaryBreakdown,
};
