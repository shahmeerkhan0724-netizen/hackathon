import apiClient from './axios';

export const getAnnouncements = async (params = {}) => {
  return apiClient.get('/announcements', { params });
};

export const createAnnouncement = async (payload) => {
  return apiClient.post('/announcements', payload);
};

export const getNotifications = async (params = {}) => {
  return apiClient.get('/notifications', { params });
};

export const markNotificationRead = async (id) => {
  return apiClient.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  return apiClient.patch('/notifications/read-all');
};

export default {
  getAnnouncements,
  createAnnouncement,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
