import { z } from 'zod';

export const createHolidaySchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z.string().trim().optional(),
  isRecurring: z.boolean().optional(),
});

export const updateHolidaySchema = z.object({
  title: z.string().trim().min(2).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  description: z.string().trim().optional(),
  isRecurring: z.boolean().optional(),
});
