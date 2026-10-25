import asyncHandler from '../utils/asyncHandler.js';
import authService from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const email = req.body.email || req.body.adminEmail || req.body.username;
  const password = req.body.password || req.body.adminPassword;
  const result = await authService.login(email, password, req);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Current user profile retrieved successfully',
    data: result,
  });
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: client discards token
  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: null,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: null,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const result = await authService.resetPassword(req.user, id, newPassword, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: null,
  });
});

export const createHRUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.createHRUser(req.user, email, password, req);
  res.status(201).json({
    success: true,
    message: 'HR account created successfully',
    data: result,
  });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const result = await authService.toggleUserStatus(req.user, id, isActive, req);
  res.status(200).json({
    success: true,
    message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: result,
  });
});

export default {
  login,
  getMe,
  logout,
  changePassword,
  resetPassword,
  createHRUser,
  toggleUserStatus,
};
