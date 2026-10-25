import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    toolsUsed: {
      type: [String],
      default: [],
    },
    promptPreview: {
      type: String,
      default: '',
      maxlength: 500,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

aiLogSchema.index({ company: 1, user: 1, timestamp: -1 });

export const AILog = mongoose.model('AILog', aiLogSchema);
export default AILog;
