import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  code: z.string().trim().toUpperCase().min(2, 'Code is required'),
  daysPerYear: z.number().min(0, 'Days per year cannot be negative'),
  isPaid: z.boolean().optional(),
  isUnlimited: z.boolean().optional(),
  description: z.string().trim().optional(),
});

export const updateLeaveTypeSchema = z.object({
  name: z.string().trim().min(2).optional(),
  daysPerYear: z.number().min(0).optional(),
  isPaid: z.boolean().optional(),
  isUnlimited: z.boolean().optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});
