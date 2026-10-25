import crypto from 'crypto';
import mongoose from 'mongoose';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import SalaryStructure from '../models/SalaryStructure.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payslip from '../models/Payslip.js';
import { ROLES, EMPLOYMENT_STATUS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

/**
 * Generates a random temporary password
 * @returns {string}
 */
const generateTempPassword = () => {
  return 'Tmp@' + crypto.randomBytes(4).toString('hex') + '!';
};

/**
 * Generates the next sequential employee code if not provided
 */
const getNextEmployeeCode = async (companyId) => {
  const count = await Employee.countDocuments({ company: companyId });
  const nextNum = String(count + 1).padStart(4, '0');
  return `EMP${nextNum}`;
};

export const createEmployee = async (companyId, data, actorId, req = null) => {
  const email = data.email.toLowerCase().trim();

  // Validate unique email in User and Employee
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict(`An account with email "${email}" already exists`);
  }

  const employeeCode = (data.employeeCode || (await getNextEmployeeCode(companyId))).trim().toUpperCase();
  const existingCode = await Employee.findOne({ company: companyId, employeeCode });
  if (existingCode) {
    throw ApiError.conflict(`Employee code "${employeeCode}" already exists in this company`);
  }

  // Validate department and designation
  const dept = await Department.findOne({ _id: data.department, company: companyId });
  if (!dept) throw ApiError.badRequest('Referenced department not found in this company');

  const desg = await Designation.findOne({ _id: data.designation, company: companyId });
  if (!desg) throw ApiError.badRequest('Referenced designation not found in this company');

  const tempPassword = generateTempPassword();

  let createdUser = null;
  let createdEmployee = null;
  let createdSalary = null;

  try {
    // 1. Create User
    createdUser = new User({
      email,
      password: tempPassword,
      role: ROLES.EMPLOYEE,
      company: companyId,
      isActive: true,
      mustChangePassword: true,
    });
    await createdUser.save();

    // 2. Create Employee
    createdEmployee = new Employee({
      company: companyId,
      user: createdUser._id,
      employeeCode,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      phone: data.phone ? data.phone.trim() : '',
      address: data.address ? data.address.trim() : '',
      joiningDate: new Date(data.joiningDate),
      department: dept._id,
      designation: desg._id,
      employmentStatus: data.employmentStatus || EMPLOYMENT_STATUS.FULL_TIME,
      isActive: true,
      bankDetails: data.bankDetails || {},
      emergencyContact: data.emergencyContact || {},
    });
    await createdEmployee.save();

    // Link employee to user
    createdUser.employee = createdEmployee._id;
    await createdUser.save();

    // 3. Create SalaryStructure if basicSalary is provided
    if (data.basicSalary) {
      createdSalary = new SalaryStructure({
        company: companyId,
        employee: createdEmployee._id,
        basicSalary: Number(data.basicSalary),
        otherAllowances: Number(data.otherAllowances) || 0,
        effectiveDate: new Date(data.joiningDate),
      });
      await createdSalary.save();
    }

    await logAudit({
      companyId,
      actorId,
      action: 'CREATE_EMPLOYEE',
      entityType: 'Employee',
      entityId: createdEmployee._id,
      details: {
        employeeCode,
        fullName: createdEmployee.fullName,
        email,
        department: dept.name,
        designation: desg.title,
      },
      req,
    });

    const populated = await Employee.findById(createdEmployee._id).populate('department designation');

    return {
      employee: populated,
      temporaryPassword: tempPassword,
      message: 'Employee and login account created successfully. Temporary password returned for HR conveyance.',
    };
  } catch (error) {
    // Cleanup on failure if partial records created
    if (createdSalary?._id) await SalaryStructure.findByIdAndDelete(createdSalary._id);
    if (createdEmployee?._id) await Employee.findByIdAndDelete(createdEmployee._id);
    if (createdUser?._id) await User.findByIdAndDelete(createdUser._id);
    throw error;
  }
};

export const getEmployees = async (companyId, query = {}) => {
  const { page, limit, skip, sort } = getPaginationParams(query, { defaultSortBy: 'createdAt' });

  const filter = { company: companyId };

  if (query.department) {
    filter.department = query.department;
  }

  if (query.employmentStatus) {
    filter.employmentStatus = query.employmentStatus;
  }

  if (typeof query.isActive !== 'undefined') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { employeeCode: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  const [items, totalItems] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name code')
      .populate('designation', 'title')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export const getEmployeeById = async (companyId, employeeId, actorUser) => {
  // Authorization check: Employee can only see their own 360 profile!
  if (actorUser.role === ROLES.EMPLOYEE) {
    if (!actorUser.employee || actorUser.employee.toString() !== employeeId.toString()) {
      throw ApiError.forbidden('You can only view your own profile');
    }
  }

  const employee = await Employee.findOne({ _id: employeeId, company: companyId })
    .populate('department')
    .populate('designation');

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  // Fetch Salary Structure (only HR and ADMIN can see full salary, or the employee themselves)
  const salaryStructure = await SalaryStructure.findOne({ employee: employee._id, company: companyId });

  // Fetch recent attendance
  const recentAttendance = await Attendance.find({ employee: employee._id, company: companyId })
    .sort({ date: -1 })
    .limit(10);

  // Fetch recent leaves
  const recentLeaves = await LeaveRequest.find({ employee: employee._id, company: companyId })
    .populate('leaveType', 'name code')
    .sort({ createdAt: -1 })
    .limit(5);

  // Fetch recent payslips
  const recentPayslips = await Payslip.find({ employee: employee._id, company: companyId, isFinalized: true })
    .sort({ year: -1, month: -1 })
    .limit(6);

  return {
    profile: employee,
    salaryStructure: salaryStructure || null,
    recentAttendance,
    recentLeaves,
    recentPayslips,
  };
};

export const updateEmployee = async (companyId, employeeId, data, actorId, req = null) => {
  const employee = await Employee.findOne({ _id: employeeId, company: companyId });
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  if (data.department) {
    const dept = await Department.findOne({ _id: data.department, company: companyId });
    if (!dept) throw ApiError.badRequest('Referenced department not found');
    employee.department = dept._id;
  }

  if (data.designation) {
    const desg = await Designation.findOne({ _id: data.designation, company: companyId });
    if (!desg) throw ApiError.badRequest('Referenced designation not found');
    employee.designation = desg._id;
  }

  if (data.firstName) employee.firstName = data.firstName.trim();
  if (data.lastName) employee.lastName = data.lastName.trim();
  if (data.phone !== undefined) employee.phone = data.phone.trim();
  if (data.address !== undefined) employee.address = data.address.trim();
  if (data.employmentStatus) employee.employmentStatus = data.employmentStatus;
  if (data.exitDate !== undefined) employee.exitDate = data.exitDate ? new Date(data.exitDate) : null;
  if (data.bankDetails) employee.bankDetails = { ...employee.bankDetails, ...data.bankDetails };
  if (data.emergencyContact) employee.emergencyContact = { ...employee.emergencyContact, ...data.emergencyContact };

  if (typeof data.isActive === 'boolean') {
    employee.isActive = data.isActive;
    await User.findByIdAndUpdate(employee.user, { isActive: data.isActive });
  }

  await employee.save();

  await logAudit({
    companyId,
    actorId,
    action: 'UPDATE_EMPLOYEE',
    entityType: 'Employee',
    entityId: employee._id,
    details: { employeeCode: employee.employeeCode, updatedFields: Object.keys(data) },
    req,
  });

  return Employee.findById(employee._id).populate('department designation');
};

export const updateSelfProfile = async (companyId, employeeId, data, req = null) => {
  const employee = await Employee.findOne({ _id: employeeId, company: companyId });
  if (!employee) {
    throw ApiError.notFound('Employee profile not found');
  }

  // Employees can only update safe contact and personal fields
  if (data.phone !== undefined) employee.phone = data.phone.trim();
  if (data.address !== undefined) employee.address = data.address.trim();
  if (data.bankDetails) employee.bankDetails = { ...employee.bankDetails, ...data.bankDetails };
  if (data.emergencyContact) employee.emergencyContact = { ...employee.emergencyContact, ...data.emergencyContact };

  await employee.save();

  await logAudit({
    companyId,
    actorId: employee.user,
    action: 'SELF_UPDATE_PROFILE',
    entityType: 'Employee',
    entityId: employee._id,
    details: { fieldsUpdated: Object.keys(data) },
    req,
  });

  return employee;
};

/**
 * CSV Import with Dry-Run Validation
 * Format expected:
 * employeeCode,firstName,lastName,email,phone,departmentCode,designationTitle,joiningDate,basicSalary,employmentStatus
 */
export const importEmployeesCsv = async (companyId, csvContent, dryRun = true, actorId, req = null) => {
  if (!csvContent || typeof csvContent !== 'string') {
    throw ApiError.badRequest('CSV content string is required');
  }

  let records = [];
  try {
    records = csvParse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw ApiError.badRequest(`Failed to parse CSV: ${err.message}`);
  }

  if (records.length === 0) {
    throw ApiError.badRequest('Uploaded CSV file is empty or contains only headers');
  }

  // Pre-load departments and designations for the company
  const departments = await Department.find({ company: companyId });
  const deptMap = new Map();
  for (const d of departments) {
    if (d.code) deptMap.set(d.code.toUpperCase(), d._id);
    deptMap.set(d.name.toLowerCase(), d._id);
  }

  const designations = await Designation.find({ company: companyId });
  const desgMap = new Map();
  for (const d of designations) {
    desgMap.set(d.title.toLowerCase(), d._id);
  }

  const errors = [];
  const validRows = [];
  const seenEmails = new Set();
  const seenCodes = new Set();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for header line
    const rowErrors = [];

    const email = (row.email || '').toLowerCase().trim();
    const employeeCode = (row.employeeCode || '').toUpperCase().trim();
    const firstName = (row.firstName || '').trim();
    const lastName = (row.lastName || '').trim();
    const joiningDate = (row.joiningDate || '').trim();
    const basicSalary = Number(row.basicSalary);
    const deptRef = (row.department || row.departmentCode || '').trim();
    const desgRef = (row.designation || row.designationTitle || '').trim();

    // Required fields check
    if (!firstName) rowErrors.push({ field: 'firstName', reason: 'First name is required' });
    if (!lastName) rowErrors.push({ field: 'lastName', reason: 'Last name is required' });
    if (!email || !email.includes('@')) rowErrors.push({ field: 'email', reason: 'Valid email is required' });
    if (!joiningDate || isNaN(Date.parse(joiningDate))) {
      rowErrors.push({ field: 'joiningDate', reason: 'Valid joining date (YYYY-MM-DD) is required' });
    }
    if (isNaN(basicSalary) || basicSalary <= 0) {
      rowErrors.push({ field: 'basicSalary', reason: 'Positive basic salary is required' });
    }

    // Duplicate check within CSV
    if (email) {
      if (seenEmails.has(email)) {
        rowErrors.push({ field: 'email', reason: `Duplicate email "${email}" found in the CSV file` });
      } else {
        seenEmails.add(email);
      }
    }

    if (employeeCode) {
      if (seenCodes.has(employeeCode)) {
        rowErrors.push({ field: 'employeeCode', reason: `Duplicate employee code "${employeeCode}" in the CSV file` });
      } else {
        seenCodes.add(employeeCode);
      }
    }

    // Department match
    let deptId = deptMap.get(deptRef.toUpperCase()) || deptMap.get(deptRef.toLowerCase());
    if (!deptId) {
      rowErrors.push({ field: 'department', reason: `Department "${deptRef}" not found in company` });
    }

    // Designation match
    let desgId = desgMap.get(desgRef.toLowerCase());
    if (!desgId) {
      rowErrors.push({ field: 'designation', reason: `Designation "${desgRef}" not found in company` });
    }

    // Check against existing database records
    if (email && !rowErrors.some((e) => e.field === 'email')) {
      const dbUser = await User.findOne({ email });
      if (dbUser) {
        rowErrors.push({ field: 'email', reason: `Email "${email}" is already registered in the system` });
      }
    }

    if (employeeCode && !rowErrors.some((e) => e.field === 'employeeCode')) {
      const dbEmp = await Employee.findOne({ company: companyId, employeeCode });
      if (dbEmp) {
        rowErrors.push({ field: 'employeeCode', reason: `Employee code "${employeeCode}" already exists in company` });
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNum,
        employeeCode: employeeCode || `Row #${rowNum}`,
        email,
        issues: rowErrors,
      });
    } else {
      validRows.push({
        employeeCode,
        firstName,
        lastName,
        email,
        phone: row.phone || '',
        address: row.address || '',
        joiningDate: new Date(joiningDate),
        department: deptId,
        designation: desgId,
        basicSalary,
        employmentStatus: row.employmentStatus || EMPLOYMENT_STATUS.FULL_TIME,
      });
    }
  }

  // Summary report
  const report = {
    totalRows: records.length,
    validCount: validRows.length,
    errorCount: errors.length,
    isDryRun: dryRun,
    errors,
  };

  // If dry run, or if there are errors, commit nothing and return report
  if (dryRun || errors.length > 0) {
    return {
      ...report,
      message:
        errors.length > 0
          ? `Validation failed on ${errors.length} row(s). No records imported.`
          : `Dry run successful: ${validRows.length} valid rows found. Ready to import.`,
    };
  }

  // Commit valid rows
  const importedEmployees = [];
  for (const row of validRows) {
    const res = await createEmployee(companyId, row, actorId, req);
    importedEmployees.push(res.employee);
  }

  await logAudit({
    companyId,
    actorId,
    action: 'CSV_IMPORT_EMPLOYEES',
    entityType: 'Employee',
    entityId: null,
    details: { totalImported: importedEmployees.length },
    req,
  });

  return {
    ...report,
    importedCount: importedEmployees.length,
    message: `Successfully imported ${importedEmployees.length} employee records.`,
  };
};

export const exportEmployeesCsv = async (companyId) => {
  const employees = await Employee.find({ company: companyId })
    .populate('department', 'name code')
    .populate('designation', 'title')
    .sort({ employeeCode: 1 });

  const rows = employees.map((e) => ({
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    phone: e.phone || '',
    department: e.department?.name || '',
    departmentCode: e.department?.code || '',
    designation: e.designation?.title || '',
    joiningDate: e.joiningDate ? e.joiningDate.toISOString().split('T')[0] : '',
    employmentStatus: e.employmentStatus,
    isActive: e.isActive,
  }));

  const csv = csvStringify(rows, {
    header: true,
  });

  return csv;
};

export default {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateSelfProfile,
  importEmployeesCsv,
  exportEmployeesCsv,
};
