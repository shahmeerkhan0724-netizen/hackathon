import { z } from 'zod';

export const salaryStructureSchema = z.object({
  basicSalary: z.number().positive('Basic salary must be greater than 0'),
  otherAllowances: z.number().min(0, 'Other allowances cannot be negative').optional(),
  effectiveDate: z.string().optional(),
});

export const createPayrollRunSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  notes: z.string().trim().max(500).optional(),
});
