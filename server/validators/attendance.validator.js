import { z } from 'zod';

export const checkInSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export const checkOutSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export const correctionRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  requestedCheckIn: z.string().min(1, 'Requested check-in time is required'),
  requestedCheckOut: z.string().optional().nullable(),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters'),
});

export const correctionDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  decisionNote: z.string().trim().optional(),
});
