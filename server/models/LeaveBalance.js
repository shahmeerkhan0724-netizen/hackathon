import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
    annual: {
      total: { type: Number, default: 14, min: 0 },
      used: { type: Number, default: 0, min: 0 },
    },
    sick: {
      total: { type: Number, default: 8, min: 0 },
      used: { type: Number, default: 0, min: 0 },
    },
    casual: {
      total: { type: Number, default: 10, min: 0 },
      used: { type: Number, default: 0, min: 0 },
    },
    unpaid: {
      used: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

leaveBalanceSchema.index(
  { employee: 1, year: 1 },
  { unique: true }
);

export default mongoose.models.LeaveBalance ||
  mongoose.model("LeaveBalance", leaveBalanceSchema);