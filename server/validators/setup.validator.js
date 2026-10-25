import { z } from 'zod';

export const initializeSetupSchema = z
  .object({
    companyName: z.string().trim().min(2, 'Company name must be at least 2 characters'),
    legalName: z.string().trim().optional(),
    adminEmail: z.string().trim().email('Valid admin email is required').optional(),
    email: z.string().trim().email('Valid email is required').optional(),
    adminPassword: z.string().min(8, 'Admin password must be at least 8 characters long').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
    officeStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Office start time must be in HH:MM format').optional(),
    gracePeriodMinutes: z.number().int().min(0).max(120).optional(),
    halfDayHours: z.number().min(1).max(12).optional(),
    weekendDays: z.array(z.number().int().min(0).max(6)).optional(),
  })
  .refine((data) => data.adminEmail || data.email, {
    message: 'Valid admin email is required',
    path: ['adminEmail'],
  })
  .refine((data) => data.adminPassword || data.password, {
    message: 'Admin password must be at least 8 characters long',
    path: ['adminPassword'],
  });
