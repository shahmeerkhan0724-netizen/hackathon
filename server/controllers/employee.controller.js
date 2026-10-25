import asyncHandler from '../utils/asyncHandler.js';
import employeeService from '../services/employee.service.js';

export const createEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.createEmployee(req.companyId, req.body, req.user._id, req);
  res.status(201).json({
    success: true,
    message: result.message,
    data: {
      employee: result.employee,
      temporaryPassword: result.temporaryPassword,
    },
  });
});

export const getEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployees(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Employees retrieved successfully',
    data: result,
  });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployeeById(req.companyId, req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Employee profile retrieved successfully',
    data: result,
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  if (!req.employee) {
    return res.status(200).json({
      success: true,
      message: 'No employee record linked to this user',
      data: null,
    });
  }
  const result = await employeeService.getEmployeeById(req.companyId, req.employee._id, req.user);
  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.companyId, req.params.id, req.body, req.user._id, req);
  res.status(200).json({
    success: true,
    message: 'Employee updated successfully',
    data: employee,
  });
});

export const updateSelfProfile = asyncHandler(async (req, res) => {
  if (!req.employee) {
    return res.status(400).json({
      success: false,
      message: 'No employee record linked to this user',
    });
  }
  const employee = await employeeService.updateSelfProfile(req.companyId, req.employee._id, req.body, req);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: employee,
  });
});

export const importEmployees = asyncHandler(async (req, res) => {
  const dryRun = req.query.dryRun === 'true' || req.query.dryRun === true;
  const csvContent = typeof req.body === 'string' ? req.body : req.body.csvData;
  const report = await employeeService.importEmployeesCsv(req.companyId, csvContent, dryRun, req.user._id, req);
  res.status(200).json({
    success: report.errorCount === 0,
    message: report.message,
    data: report,
  });
});

export const exportEmployees = asyncHandler(async (req, res) => {
  const csvData = await employeeService.exportEmployeesCsv(req.companyId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="employees_directory.csv"');
  res.status(200).send(csvData);
});

export default {
  createEmployee,
  getEmployees,
  getEmployeeById,
  getMyProfile,
  updateEmployee,
  updateSelfProfile,
  importEmployees,
  exportEmployees,
};
