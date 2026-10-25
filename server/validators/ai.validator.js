import { z } from 'zod';

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional(),
}).refine((data) => data.message || (data.messages && data.messages.length > 0), {
  message: 'Either message or messages array is required',
});

export const aiSummarySchema = z.object({
  kpis: z.record(z.any()).optional(),
  period: z.string().optional(),
});

export const smartLeaveSchema = z.object({
  query: z.string().trim().min(3, 'Please describe your leave request'),
});
