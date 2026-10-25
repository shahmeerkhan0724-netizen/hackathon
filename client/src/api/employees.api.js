import apiClient from './axios';

export const getEmployees = async (params = {}) => {
  return apiClient.get('/employees', { params });
};

export const getEmployeeById = async (id) => {
  return apiClient.get(`/employees/${id}`);
};

export const getMyProfile = async () => {
  return apiClient.get('/employees/me');
};

export const createEmployee = async (payload) => {
  return apiClient.post('/employees', payload);
};

export const updateEmployee = async (id, payload) => {
  return apiClient.put(`/employees/${id}`, payload);
};

export const updateSelfProfile = async (payload) => {
  return apiClient.patch('/employees/me', payload);
};

export const importEmployees = async (csvData, dryRun = true) => {
  return apiClient.post(`/employees/import?dryRun=${dryRun}`, csvData, {
    headers: { 'Content-Type': 'text/plain' },
  });
};

export const exportEmployees = async () => {
  return apiClient.get('/employees/export', {
    responseType: 'blob',
  });
};

export default {
  getEmployees,
  getEmployeeById,
  getMyProfile,
  createEmployee,
  updateEmployee,
  updateSelfProfile,
  importEmployees,
  exportEmployees,
};
