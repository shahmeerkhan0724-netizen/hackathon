import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters'),
  code: z.string().trim().min(1).max(20).optional(),
  description: z.string().trim().max(500).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  code: z.string().trim().min(1).max(20).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});
