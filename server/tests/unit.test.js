import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

import {
  calculateWorkingDays,
  getMonthlyWorkingDays,
  formatDateStr,
  isWeekend,
} from '../utils/workingDays.js';
import {
  calculateAnnualTax,
  calculateMonthlyTax,
  calculateSalaryBreakdown,
} from '../utils/taxCalculator.js';
import { generateToken, verifyToken } from '../utils/generateToken.js';
import { ApiError } from '../utils/ApiError.js';

describe('Unit Tests: Working Days Utility (Requirement 9)', () => {
  it('should format date string to YYYY-MM-DD correctly', () => {
    const d = new Date(2026, 4, 15); // May 15, 2026
    assert.equal(formatDateStr(d), '2026-05-15');
  });

  it('should identify weekends correctly (Saturday and Sunday)', () => {
    // 2026-05-16 is Saturday, 2026-05-17 is Sunday, 2026-05-18 is Monday
    assert.equal(isWeekend('2026-05-16', [0, 6]), true);
    assert.equal(isWeekend('2026-05-17', [0, 6]), true);
    assert.equal(isWeekend('2026-05-18', [0, 6]), false);
  });

  it('should exclude weekend days and company holidays from working days count', () => {
    // 2026-05-11 (Mon) to 2026-05-17 (Sun): 7 total days, 5 weekdays, 2 weekend days
    // Let's add 2026-05-12 as a public holiday
    const result = calculateWorkingDays(
      '2026-05-11',
      '2026-05-17',
      [0, 6],
      ['2026-05-12']
    );

    assert.equal(result.totalDays, 7);
    assert.equal(result.weekendDates.length, 2);
    assert.equal(result.holidayDates.length, 1);
    assert.equal(result.workingDays, 4); // 7 - 2 weekends - 1 holiday = 4
    assert.deepEqual(result.workingDateList, [
      '2026-05-11',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ]);
  });

  it('should return 0 working days if date range is inverted', () => {
    const result = calculateWorkingDays('2026-05-20', '2026-05-10');
    assert.equal(result.workingDays, 0);
  });
});

describe('Unit Tests: Tax Calculations and Slabs (Requirement 12)', () => {
  it('Slab 1: Up to 600,000 -> 0% tax', () => {
    assert.equal(calculateAnnualTax(0), 0);
    assert.equal(calculateAnnualTax(300000), 0);
    assert.equal(calculateAnnualTax(600000), 0);
    assert.equal(calculateMonthlyTax(600000), 0);
  });

  it('Slab 2: 600,001 to 1,200,000 -> 5% of amount above 600,000', () => {
    // For 800,000: taxable = 200,000 * 0.05 = 10,000
    assert.equal(calculateAnnualTax(800000), 10000);
    // Boundary 1,200,000: taxable = 600,000 * 0.05 = 30,000
    assert.equal(calculateAnnualTax(1200000), 30000);
    assert.equal(calculateMonthlyTax(1200000), 2500); // 30,000 / 12
  });

  it('Slab 3: 1,200,001 to 2,400,000 -> 30,000 + 15% of amount above 1,200,000', () => {
    // For 1,800,000: 30,000 + (600,000 * 0.15) = 30,000 + 90,000 = 120,000
    assert.equal(calculateAnnualTax(1800000), 120000);
    // Boundary 2,400,000: 30,000 + (1,200,000 * 0.15) = 30,000 + 180,000 = 210,000
    assert.equal(calculateAnnualTax(2400000), 210000);
    assert.equal(calculateMonthlyTax(2400000), 17500); // 210,000 / 12
  });

  it('Slab 4: 2,400,001 to 3,600,000 -> 210,000 + 25% of amount above 2,400,000', () => {
    // For 3,000,000: 210,000 + (600,000 * 0.25) = 210,000 + 150,000 = 360,000
    assert.equal(calculateAnnualTax(3000000), 360000);
    // Boundary 3,600,000: 210,000 + (1,200,000 * 0.25) = 210,000 + 300,000 = 510,000
    assert.equal(calculateAnnualTax(3600000), 510000);
  });

  it('Slab 5: Above 3,600,000 -> 510,000 + 35% of amount above 3,600,000', () => {
    // For 4,600,000: 510,000 + (1,000,000 * 0.35) = 510,000 + 350,000 = 860,000
    assert.equal(calculateAnnualTax(4600000), 860000);
  });

  it('Salary breakdown: HRA=40%, Medical=10%, Gross=1.5*basic', () => {
    const basic = 100000;
    const breakdown = calculateSalaryBreakdown(basic);
    assert.equal(breakdown.basicSalary, 100000);
    assert.equal(breakdown.hra, 40000);
    assert.equal(breakdown.medicalAllowance, 10000);
    assert.equal(breakdown.grossSalary, 150000); // 1.5 * basic
    assert.equal(breakdown.annualGross, 1800000);
    // annual tax for 1,800,000 is 120,000 -> monthly tax is 10,000
    assert.equal(breakdown.annualTax, 120000);
    assert.equal(breakdown.monthlyTax, 10000);
    assert.equal(breakdown.netMonthlySalary, 140000);
  });
});

describe('Unit Tests: Security, Hashing & JWT (Requirements 3 & 4)', () => {
  it('Passwords should be securely hashed and verified with bcryptjs', async () => {
    const plain = 'MySecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plain, salt);

    assert.notEqual(plain, hash);
    assert.match(hash, /^\$2[aby]\$/); // bcrypt hash prefix

    const isMatch = await bcrypt.compare(plain, hash);
    assert.equal(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.equal(isWrongMatch, false);
  });

  it('JWT token generation and verification should preserve claims', () => {
    const payload = {
      id: '64a000000000000000000001',
      role: 'ADMIN',
      companyId: '64a000000000000000000002',
    };

    const token = generateToken(payload);
    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = verifyToken(token);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.role, payload.role);
    assert.equal(decoded.companyId, payload.companyId);
  });

  it('ApiError should format consistent error responses with status codes', () => {
    const err = ApiError.badRequest('Invalid input field', [{ field: 'email', message: 'Invalid' }]);
    assert.equal(err.statusCode, 400);
    assert.equal(err.message, 'Invalid input field');
    assert.equal(err.errors.length, 1);
    assert.equal(err.success, false);
  });
});
