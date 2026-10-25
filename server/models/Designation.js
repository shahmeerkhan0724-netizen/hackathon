import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    level: {
      type: String,
      enum: ["Intern", "Junior", "Mid", "Senior", "Lead", "Manager"],
      default: "Junior",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

designationSchema.index(
  { department: 1, code: 1 },
  { unique: true }
);

export default mongoose.models.Designation ||
  mongoose.model("Designation", designationSchema);