import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z.string().trim().email('Valid email is required').optional(),
    adminEmail: z.string().trim().email('Valid email is required').optional(),
    username: z.string().trim().optional(),
    password: z.string().min(1, 'Password is required').optional(),
    adminPassword: z.string().min(1, 'Password is required').optional(),
  })
  .refine((data) => data.email || data.adminEmail || data.username, {
    message: 'Valid email is required',
    path: ['email'],
  })
  .refine((data) => data.password || data.adminPassword, {
    message: 'Password is required',
    path: ['password'],
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long'),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long'),
});

export const createHRUserSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
