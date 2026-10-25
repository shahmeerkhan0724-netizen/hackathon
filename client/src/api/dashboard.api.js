import apiClient from './axios';

export const getAdminDashboard = async (params = {}) => {
  return apiClient.get('/dashboard/admin', { params });
};

export const getHRDashboard = async (params = {}) => {
  return apiClient.get('/dashboard/hr', { params });
};

export const getEmployeeDashboard = async () => {
  return apiClient.get('/dashboard/me');
};

export default {
  getAdminDashboard,
  getHRDashboard,
  getEmployeeDashboard,
};
