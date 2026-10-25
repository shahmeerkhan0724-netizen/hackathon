import apiClient from './axios';

export const applyLeave = async (payload) => {
  return apiClient.post('/leaves', payload);
};

export const getMyLeaves = async (params = {}) => {
  return apiClient.get('/leaves/me', { params });
};

export const getMyLeaveBalances = async () => {
  return apiClient.get('/leaves/balance/me');
};

export const getAllLeaves = async (params = {}) => {
  return apiClient.get('/leaves', { params });
};

export const cancelLeave = async (id) => {
  return apiClient.patch(`/leaves/${id}/cancel`);
};

export const decideLeave = async (id, payload) => {
  return apiClient.patch(`/leaves/${id}/decision`, payload);
};

export default {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalances,
  getAllLeaves,
  cancelLeave,
  decideLeave,
};
