import apiClient from './axios';

export const sendAIChat = async (messageOrMessages) => {
  const payload =
    typeof messageOrMessages === 'string'
      ? { message: messageOrMessages }
      : { messages: messageOrMessages };
  return apiClient.post('/ai/chat', payload);
};

export const getAIDashboardSummary = async (kpis = {}) => {
  return apiClient.post('/ai/summary', { kpis });
};

export const parseSmartLeave = async (query) => {
  return apiClient.post('/ai/smart-leave', { query });
};

export default {
  sendAIChat,
  getAIDashboardSummary,
  parseSmartLeave,
};
