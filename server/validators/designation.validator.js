import { z } from 'zod';

export const createDesignationSchema = z.object({
  title: z.string().trim().min(2, 'Designation title must be at least 2 characters'),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional().nullable(),
  description: z.string().trim().max(500).optional(),
});

export const updateDesignationSchema = z.object({
  title: z.string().trim().min(2).optional(),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional().nullable(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});
