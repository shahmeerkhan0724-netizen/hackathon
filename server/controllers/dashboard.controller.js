import asyncHandler from '../utils/asyncHandler.js';
import dashboardService from '../services/dashboard.service.js';
import ApiError from '../utils/ApiError.js';

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminDashboard(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Admin dashboard data retrieved successfully',
    data,
  });
});

export const getHRDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getHRDashboard(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'HR dashboard data retrieved successfully',
    data,
  });
});

export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const data = await dashboardService.getEmployeeDashboard(req.companyId, req.employee._id, req.user._id);
  res.status(200).json({
    success: true,
    message: 'Employee dashboard data retrieved successfully',
    data,
  });
});

export default {
  getAdminDashboard,
  getHRDashboard,
  getEmployeeDashboard,
};
