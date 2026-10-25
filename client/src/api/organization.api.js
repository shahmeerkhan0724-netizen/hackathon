import apiClient from './axios';

// Departments
export const getDepartments = async (params = {}) => {
  return apiClient.get('/departments', { params });
};
export const createDepartment = async (payload) => {
  return apiClient.post('/departments', payload);
};
export const updateDepartment = async (id, payload) => {
  return apiClient.put(`/departments/${id}`, payload);
};
export const deleteDepartment = async (id) => {
  return apiClient.delete(`/departments/${id}`);
};

// Designations
export const getDesignations = async (params = {}) => {
  return apiClient.get('/designations', { params });
};
export const createDesignation = async (payload) => {
  return apiClient.post('/designations', payload);
};
export const updateDesignation = async (id, payload) => {
  return apiClient.put(`/designations/${id}`, payload);
};
export const deleteDesignation = async (id) => {
  return apiClient.delete(`/designations/${id}`);
};

// Leave Types
export const getLeaveTypes = async (params = {}) => {
  return apiClient.get('/leave-types', { params });
};
export const createLeaveType = async (payload) => {
  return apiClient.post('/leave-types', payload);
};
export const updateLeaveType = async (id, payload) => {
  return apiClient.put(`/leave-types/${id}`, payload);
};
export const deleteLeaveType = async (id) => {
  return apiClient.delete(`/leave-types/${id}`);
};

// Public Holidays
export const getHolidays = async (params = {}) => {
  return apiClient.get('/holidays', { params });
};
export const createHoliday = async (payload) => {
  return apiClient.post('/holidays', payload);
};
export const updateHoliday = async (id, payload) => {
  return apiClient.put(`/holidays/${id}`, payload);
};
export const deleteHoliday = async (id) => {
  return apiClient.delete(`/holidays/${id}`);
};

export default {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
