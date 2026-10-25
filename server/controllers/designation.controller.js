import asyncHandler from '../utils/asyncHandler.js';
import designationService from '../services/designation.service.js';

export const createDesignation = asyncHandler(async (req, res) => {
  const designation = await designationService.createDesignation(req.companyId, req.body, req.user._id, req);
  res.status(201).json({
    success: true,
    message: 'Designation created successfully',
    data: designation,
  });
});

export const getDesignations = asyncHandler(async (req, res) => {
  const designations = await designationService.getDesignations(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Designations retrieved successfully',
    data: designations,
  });
});

export const updateDesignation = asyncHandler(async (req, res) => {
  const designation = await designationService.updateDesignation(
    req.companyId,
    req.params.id,
    req.body,
    req.user._id,
    req
  );
  res.status(200).json({
    success: true,
    message: 'Designation updated successfully',
    data: designation,
  });
});

export const deleteDesignation = asyncHandler(async (req, res) => {
  const result = await designationService.deleteDesignation(req.companyId, req.params.id, req.user._id, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: null,
  });
});

export default {
  createDesignation,
  getDesignations,
  updateDesignation,
  deleteDesignation,
};
