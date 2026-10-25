import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
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
    leaveType: {
      type: String,
      enum: [
        "Annual",
        "Sick",
        "Casual",
        "Unpaid",
        "Maternity",
        "Paternity",
        "Other",
      ],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewComment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ employee: 1, startDate: 1 });

leaveRequestSchema.pre("validate", function () {
  if (
    this.startDate &&
    this.endDate &&
    this.endDate < this.startDate
  ) {
    this.invalidate("endDate", "End date cannot be before start date");
  }
});

export default mongoose.models.LeaveRequest ||
  mongoose.model("LeaveRequest", leaveRequestSchema);