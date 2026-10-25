import asyncHandler from '../utils/asyncHandler.js';
import setupService from '../services/setup.service.js';

export const getStatus = asyncHandler(async (req, res) => {
  const status = await setupService.getSetupStatus();
  res.status(200).json({
    success: true,
    message: 'Setup status retrieved successfully',
    data: status,
  });
});

export const initialize = asyncHandler(async (req, res) => {
  const result = await setupService.initializeSetup(req.body, req);
  res.status(201).json({
    success: true,
    message: 'System successfully initialized with Company and Admin account',
    data: result,
  });
});

export default {
  getStatus,
  initialize,
};
