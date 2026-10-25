import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  content: z.string().trim().min(5, 'Content must be at least 5 characters'),
  targetAudience: z.enum(['ALL', 'DEPARTMENTS']).optional(),
  targetDepartments: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID')).optional(),
  isPinned: z.boolean().optional(),
  priority: z.enum(['NORMAL', 'HIGH', 'URGENT']).optional(),
});
