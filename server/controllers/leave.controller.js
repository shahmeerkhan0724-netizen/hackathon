import asyncHandler from '../utils/asyncHandler.js';
import leaveService from '../services/leave.service.js';
import ApiError from '../utils/ApiError.js';

export const applyLeave = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const result = await leaveService.applyLeave(req.companyId, req.employee._id, req.body, req);
  res.status(201).json({
    success: true,
    message: result.message,
    data: result.leaveRequest,
  });
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const result = await leaveService.getMyLeaves(req.companyId, req.employee._id, req.query);
  res.status(200).json({
    success: true,
    message: 'My leave history retrieved successfully',
    data: result,
  });
});

export const getMyBalances = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const balances = await leaveService.getEmployeeLeaveBalances(req.companyId, req.employee._id);
  res.status(200).json({
    success: true,
    message: 'Leave balances retrieved successfully',
    data: balances,
  });
});

export const getAllLeaves = asyncHandler(async (req, res) => {
  const result = await leaveService.getAllLeaves(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Leave requests retrieved successfully',
    data: result,
  });
});

export const cancelLeave = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const result = await leaveService.cancelLeave(req.companyId, req.employee._id, req.params.id, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: result.leave,
  });
});

export const decideLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.decideLeave(req.companyId, req.params.id, req.body, req.user, req);
  res.status(200).json({
    success: true,
    message: `Leave request ${req.body.status.toLowerCase()} successfully`,
    data: leave,
  });
});

export default {
  applyLeave,
  getMyLeaves,
  getMyBalances,
  getAllLeaves,
  cancelLeave,
  decideLeave,
};
