import asyncHandler from '../utils/asyncHandler.js';
import leaveTypeService from '../services/leaveType.service.js';

export const createLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveTypeService.createLeaveType(req.companyId, req.body, req.user._id, req);
  res.status(201).json({
    success: true,
    message: 'Leave type created successfully',
    data: leaveType,
  });
});

export const getLeaveTypes = asyncHandler(async (req, res) => {
  const leaveTypes = await leaveTypeService.getLeaveTypes(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Leave types retrieved successfully',
    data: leaveTypes,
  });
});

export const updateLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveTypeService.updateLeaveType(req.companyId, req.params.id, req.body, req.user._id, req);
  res.status(200).json({
    success: true,
    message: 'Leave type updated successfully',
    data: leaveType,
  });
});

export const deleteLeaveType = asyncHandler(async (req, res) => {
  const result = await leaveTypeService.deleteLeaveType(req.companyId, req.params.id, req.user._id, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: null,
  });
});

export default {
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType,
};
