import mongoose from 'mongoose';
import { CORRECTION_STATUS_LIST, CORRECTION_STATUS } from '../config/constants.js';

const attendanceCorrectionSchema = new mongoose.Schema(
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
      index: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date is required for attendance correction'],
    },
    requestedCheckIn: {
      type: Date,
      required: [true, 'Requested check-in time is required'],
    },
    requestedCheckOut: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Reason for correction is required'],
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: CORRECTION_STATUS_LIST,
      default: CORRECTION_STATUS.PENDING,
      index: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decisionNote: {
      type: String,
      trim: true,
      default: '',
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

attendanceCorrectionSchema.index({ company: 1, employee: 1, date: 1, status: 1 });

export const AttendanceCorrection = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
export default AttendanceCorrection;
