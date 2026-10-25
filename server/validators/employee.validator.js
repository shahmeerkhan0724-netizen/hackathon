import { z } from 'zod';
import { EMPLOYMENT_STATUS_LIST } from '../config/constants.js';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(2, 'Employee code must be at least 2 chars').optional(),
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid department ID is required'),
  designation: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid designation ID is required'),
  employmentStatus: z.enum(EMPLOYMENT_STATUS_LIST).optional(),
  basicSalary: z.number().positive('Basic salary must be a positive number'),
  otherAllowances: z.number().min(0).optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  department: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid department ID is required').optional(),
  designation: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid designation ID is required').optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUS_LIST).optional(),
  isActive: z.boolean().optional(),
  exitDate: z.string().nullable().optional(),
  bankDetails: z
    .object({
      accountTitle: z.string().trim().optional(),
      accountNumber: z.string().trim().optional(),
      bankName: z.string().trim().optional(),
      iban: z.string().trim().optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().optional(),
      relationship: z.string().trim().optional(),
      phone: z.string().trim().optional(),
    })
    .optional(),
});

export const updateSelfProfileSchema = z.object({
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  bankDetails: z
    .object({
      accountTitle: z.string().trim().optional(),
      accountNumber: z.string().trim().optional(),
      bankName: z.string().trim().optional(),
      iban: z.string().trim().optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().optional(),
      relationship: z.string().trim().optional(),
      phone: z.string().trim().optional(),
    })
    .optional(),
});
