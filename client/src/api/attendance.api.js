import apiClient from './axios';

export const checkIn = async (note = '') => {
  return apiClient.post('/attendance/check-in', { note });
};

export const checkOut = async (note = '') => {
  return apiClient.post('/attendance/check-out', { note });
};

export const getMyAttendance = async (params = {}) => {
  return apiClient.get('/attendance/me', { params });
};

export const getDailyBoard = async (date) => {
  return apiClient.get('/attendance', { params: { date } });
};

export const requestCorrection = async (payload) => {
  return apiClient.post('/attendance/corrections', payload);
};

export const getCorrections = async (params = {}) => {
  return apiClient.get('/attendance/corrections', { params });
};

export const decideCorrection = async (id, payload) => {
  return apiClient.patch(`/attendance/corrections/${id}/decision`, payload);
};

export default {
  checkIn,
  checkOut,
  getMyAttendance,
  getDailyBoard,
  requestCorrection,
  getCorrections,
  decideCorrection,
};
