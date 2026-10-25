import { z } from 'zod';

export const updateCompanySettingsSchema = z.object({
  name: z.string().trim().min(2).optional(),
  legalName: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  settings: z
    .object({
      officeStartTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Office start time must be in HH:MM format')
        .optional(),
      gracePeriodMinutes: z.number().int().min(0).max(120).optional(),
      halfDayHours: z.number().min(1).max(12).optional(),
      weekendDays: z.array(z.number().int().min(0).max(6)).optional(),
      geofence: z
        .object({
          latitude: z.number().nullable().optional(),
          longitude: z.number().nullable().optional(),
          radiusMeters: z.number().min(10).max(10000).optional(),
        })
        .optional(),
    })
    .optional(),
});
