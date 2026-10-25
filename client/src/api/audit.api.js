import apiClient from './axios';

export const getAuditLogs = async (params = {}) => {
  return apiClient.get('/audit', { params });
};

export default {
  getAuditLogs,
};
