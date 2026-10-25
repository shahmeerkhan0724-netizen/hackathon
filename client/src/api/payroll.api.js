import apiClient from './axios';

export const setSalaryStructure = async (employeeId, payload) => {
  return apiClient.put(`/payroll/salary-structures/${employeeId}`, payload);
};

export const getSalaryStructure = async (employeeId) => {
  return apiClient.get(`/payroll/salary-structures/${employeeId}`);
};

export const createPayrollRun = async (payload) => {
  return apiClient.post('/payroll/runs', payload);
};

export const getPayrollRuns = async (params = {}) => {
  return apiClient.get('/payroll/runs', { params });
};

export const getPayrollRunById = async (id) => {
  return apiClient.get(`/payroll/runs/${id}`);
};

export const finalizePayrollRun = async (id) => {
  return apiClient.post(`/payroll/runs/${id}/finalize`);
};

export const getMyPayslips = async (params = {}) => {
  return apiClient.get('/payroll/me/payslips', { params });
};

export const getMyPayslipById = async (id) => {
  return apiClient.get(`/payroll/me/payslips/${id}`);
};

export const downloadMyPayslipPdf = async (id) => {
  return apiClient.get(`/payroll/me/payslips/${id}/pdf`, {
    responseType: 'blob',
  });
};

export const getPayslipById = async (id) => {
  return apiClient.get(`/payroll/payslips/${id}`);
};

export const downloadPayslipPdf = async (id) => {
  return apiClient.get(`/payroll/payslips/${id}/pdf`, {
    responseType: 'blob',
  });
};

export default {
  setSalaryStructure,
  getSalaryStructure,
  createPayrollRun,
  getPayrollRuns,
  getPayrollRunById,
  finalizePayrollRun,
  getMyPayslips,
  getMyPayslipById,
  downloadMyPayslipPdf,
  getPayslipById,
  downloadPayslipPdf,
};
