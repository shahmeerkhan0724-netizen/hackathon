import mongoose from 'mongoose';

const salaryStructureSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary must be positive'],
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
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

salaryStructureSchema.pre('validate', function () {
  if (typeof this.basicSalary === 'number') {
    this.hra = Math.round(this.basicSalary * 0.4);
    this.medicalAllowance = Math.round(this.basicSalary * 0.1);
    this.otherAllowances = Math.max(0, this.otherAllowances || 0);
    this.grossSalary = this.basicSalary + this.hra + this.medicalAllowance + this.otherAllowances;
  }
});

export const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);
export default SalaryStructure;
