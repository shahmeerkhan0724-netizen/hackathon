import asyncHandler from '../utils/asyncHandler.js';
import attendanceService from '../services/attendance.service.js';
import ApiError from '../utils/ApiError.js';

export const checkIn = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const result = await attendanceService.checkIn(req.companyId, req.employee._id, req.body.note, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: result.attendance,
  });
});

export const checkOut = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const result = await attendanceService.checkOut(req.companyId, req.employee._id, req.body.note, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: result.attendance,
  });
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const records = await attendanceService.getMyAttendance(req.companyId, req.employee._id, req.query);
  res.status(200).json({
    success: true,
    message: 'Attendance records retrieved successfully',
    data: records,
  });
});

export const getDailyBoard = asyncHandler(async (req, res) => {
  const result = await attendanceService.getDailyAttendanceBoard(req.companyId, req.query.date);
  res.status(200).json({
    success: true,
    message: 'Daily attendance board retrieved successfully',
    data: result,
  });
});

export const requestCorrection = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const correction = await attendanceService.requestCorrection(req.companyId, req.employee._id, req.body, req);
  res.status(201).json({
    success: true,
    message: 'Attendance correction request submitted successfully',
    data: correction,
  });
});

export const getCorrections = asyncHandler(async (req, res) => {
  const result = await attendanceService.getCorrections(req.companyId, req.query, req.user);
  res.status(200).json({
    success: true,
    message: 'Correction requests retrieved successfully',
    data: result,
  });
});

export const decideCorrection = asyncHandler(async (req, res) => {
  const correction = await attendanceService.decideCorrection(
    req.companyId,
    req.params.id,
    req.body,
    req.user,
    req
  );
  res.status(200).json({
    success: true,
    message: `Attendance correction request ${req.body.status.toLowerCase()} successfully`,
    data: correction,
  });
});

export default {
  checkIn,
  checkOut,
  getMyAttendance,
  getDailyBoard,
  requestCorrection,
  getCorrections,
  decideCorrection,
};
