import asyncHandler from '../utils/asyncHandler.js';
import aiService from '../services/ai.service.js';

export const chat = asyncHandler(async (req, res) => {
  const result = await aiService.chatWithAI(req.companyId, req.user, req.body, req);
  res.status(200).json({
    success: true,
    message: 'AI response generated successfully',
    data: result,
  });
});

export const summarize = asyncHandler(async (req, res) => {
  const result = await aiService.generateDashboardSummary(req.companyId, req.user, req.body.kpis);
  res.status(200).json({
    success: true,
    message: 'AI summary generated successfully',
    data: result,
  });
});

export const smartLeave = asyncHandler(async (req, res) => {
  const result = await aiService.parseSmartLeave(req.companyId, req.body.query);
  res.status(200).json({
    success: true,
    message: 'Smart leave suggestion generated successfully',
    data: result,
  });
});

export default {
  chat,
  summarize,
  smartLeave,
};
