import asyncHandler from '../utils/asyncHandler.js';
import companyService from '../services/company.service.js';

export const getCompany = asyncHandler(async (req, res) => {
  const company = await companyService.getCompany(req.companyId);
  res.status(200).json({
    success: true,
    message: 'Company profile retrieved successfully',
    data: company,
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const company = await companyService.updateCompanySettings(req.companyId, req.body, req.user._id, req);
  res.status(200).json({
    success: true,
    message: 'Company settings updated successfully',
    data: company,
  });
});

export default {
  getCompany,
  updateSettings,
};
