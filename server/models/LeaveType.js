import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: [true, 'Leave type code is required'],
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    daysPerYear: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    isUnlimited: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

leaveTypeSchema.index({ company: 1, code: 1 }, { unique: true });

export const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);
export default LeaveType;
