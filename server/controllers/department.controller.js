import asyncHandler from '../utils/asyncHandler.js';
import departmentService from '../services/department.service.js';

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.companyId, req.body, req.user._id, req);
  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: department,
  });
});

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.getDepartments(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Departments retrieved successfully',
    data: departments,
  });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.companyId, req.params.id, req.body, req.user._id, req);
  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    data: department,
  });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const result = await departmentService.deleteDepartment(req.companyId, req.params.id, req.user._id, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: null,
  });
});

export default {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};
