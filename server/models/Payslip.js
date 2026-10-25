import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    payrollRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    hra: {
      type: Number,
      default: 0,
    },
    medicalAllowance: {
      type: Number,
      default: 0,
    },
    otherAllowances: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    expectedWorkingDays: {
      type: Number,
      required: true,
      min: 1,
    },
    actualWorkingDays: {
      type: Number,
      required: true,
      min: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0,
    },
    perDayGross: {
      type: Number,
      required: true,
    },
    attendanceDeduction: {
      type: Number,
      default: 0,
    },
    annualTaxableGross: {
      type: Number,
      default: 0,
    },
    annualTax: {
      type: Number,
      default: 0,
    },
    monthlyTax: {
      type: Number,
      default: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    isFinalized: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

payslipSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });
payslipSchema.index({ company: 1, employee: 1, year: 1, month: 1 });

export const Payslip = mongoose.model('Payslip', payslipSchema);
export default Payslip;
