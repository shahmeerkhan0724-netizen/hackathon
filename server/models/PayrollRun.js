import mongoose from 'mongoose';
import { PAYROLL_STATUS_LIST, PAYROLL_STATUS } from '../config/constants.js';

const payrollRunSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Payroll year is required'],
      min: 2000,
      max: 2100,
    },
    month: {
      type: Number,
      required: [true, 'Payroll month is required'],
      min: 1,
      max: 12,
    },
    status: {
      type: String,
      enum: PAYROLL_STATUS_LIST,
      default: PAYROLL_STATUS.DRAFT,
      index: true,
    },
    totalGrossSalary: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalNetSalary: {
      type: Number,
      default: 0,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

payrollRunSchema.index({ company: 1, year: 1, month: 1 }, { unique: true });

export const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);
export default PayrollRun;
