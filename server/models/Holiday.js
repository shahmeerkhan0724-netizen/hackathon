import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["Public", "Company", "Optional"],
      default: "Company",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

holidaySchema.index(
  { company: 1, date: 1 },
  { unique: true }
);

export default mongoose.models.Holiday ||
  mongoose.model("Holiday", holidaySchema);