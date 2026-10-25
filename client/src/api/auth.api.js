import apiClient from './axios';

export const getSetupStatus = async () => {
  return apiClient.get('/setup/status');
};

export const initializeSetup = async (payload) => {
  return apiClient.post('/setup/initialize', payload);
};

export const loginUser = async (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

export const getMe = async () => {
  return apiClient.get('/auth/me');
};

export const logoutUser = async () => {
  return apiClient.post('/auth/logout');
};

export const changePassword = async (payload) => {
  return apiClient.post('/auth/change-password', payload);
};

export const resetUserPassword = async (userId, payload) => {
  return apiClient.patch(`/users/${userId}/reset-password`, payload);
};

export const toggleUserStatus = async (userId, isActive) => {
  return apiClient.patch(`/users/${userId}/toggle-status`, { isActive });
};

export const createHRUser = async (payload) => {
  return apiClient.post('/users/hr', payload);
};

export default {
  getSetupStatus,
  initializeSetup,
  loginUser,
  getMe,
  logoutUser,
  changePassword,
  resetUserPassword,
  toggleUserStatus,
  createHRUser,
};
