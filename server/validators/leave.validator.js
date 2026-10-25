import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leaveTypeCode: z.string().trim().toUpperCase().min(1, 'Leave type code is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters'),
});

export const leaveDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  decisionNote: z.string().trim().optional(),
});
