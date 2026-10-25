import asyncHandler from '../utils/asyncHandler.js';
import payrollService from '../services/payroll.service.js';
import ApiError from '../utils/ApiError.js';

export const setSalaryStructure = asyncHandler(async (req, res) => {
  const structure = await payrollService.setSalaryStructure(
    req.companyId,
    req.params.employeeId,
    req.body,
    req.user._id,
    req
  );
  res.status(200).json({
    success: true,
    message: 'Salary structure updated successfully',
    data: structure,
  });
});

export const getSalaryStructure = asyncHandler(async (req, res) => {
  const structure = await payrollService.getSalaryStructure(req.companyId, req.params.employeeId);
  res.status(200).json({
    success: true,
    message: 'Salary structure retrieved successfully',
    data: structure,
  });
});

export const createPayrollRun = asyncHandler(async (req, res) => {
  const run = await payrollService.createPayrollDraft(req.companyId, req.body, req.user._id, req);
  res.status(201).json({
    success: true,
    message: 'Payroll draft created successfully',
    data: run,
  });
});

export const getPayrollRuns = asyncHandler(async (req, res) => {
  const result = await payrollService.getPayrollRuns(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Payroll runs retrieved successfully',
    data: result,
  });
});

export const getPayrollRunById = asyncHandler(async (req, res) => {
  const result = await payrollService.getPayrollRunById(req.companyId, req.params.id);
  res.status(200).json({
    success: true,
    message: 'Payroll run details retrieved successfully',
    data: result,
  });
});

export const finalizePayrollRun = asyncHandler(async (req, res) => {
  const run = await payrollService.finalizePayrollRun(req.companyId, req.params.id, req.user, req);
  res.status(200).json({
    success: true,
    message: 'Payroll run finalized successfully and payslips issued',
    data: run,
  });
});

export const getMyPayslips = asyncHandler(async (req, res) => {
  if (!req.employee) {
    throw ApiError.badRequest('No employee profile linked to your user account');
  }
  const payslips = await payrollService.getMyPayslips(req.companyId, req.employee._id, req.query);
  res.status(200).json({
    success: true,
    message: 'Payslips retrieved successfully',
    data: payslips,
  });
});

export const getPayslipById = asyncHandler(async (req, res) => {
  const payslip = await payrollService.getPayslipById(req.companyId, req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Payslip retrieved successfully',
    data: payslip,
  });
});

export const downloadPayslipPdf = asyncHandler(async (req, res) => {
  await payrollService.generatePayslipPdf(req.companyId, req.params.id, req.user, res);
});

export default {
  setSalaryStructure,
  getSalaryStructure,
  createPayrollRun,
  getPayrollRuns,
  getPayrollRunById,
  finalizePayrollRun,
  getMyPayslips,
  getPayslipById,
  downloadPayslipPdf,
};
