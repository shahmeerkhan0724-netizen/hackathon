import apiClient from './axios';

export const getCompany = async () => {
  return apiClient.get('/company');
};

export const updateCompanySettings = async (payload) => {
  return apiClient.put('/company/settings', payload);
};

export default {
  getCompany,
  updateCompanySettings,
};
