import PDFDocument from 'pdfkit';
import SalaryStructure from '../models/SalaryStructure.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Holiday from '../models/Holiday.js';
import Notification from '../models/Notification.js';
import { PAYROLL_STATUS, ATTENDANCE_STATUS, LEAVE_STATUS, ROLES } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { getMonthlyWorkingDays, calculateWorkingDays, formatDateStr } from '../utils/workingDays.js';
import { calculateSalaryBreakdown, calculateAnnualTax, calculateMonthlyTax } from '../utils/taxCalculator.js';
import { logAudit } from '../utils/audit.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

export const setSalaryStructure = async (companyId, employeeId, data, actorId, req = null) => {
  const employee = await Employee.findOne({ _id: employeeId, company: companyId });
  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const breakdown = calculateSalaryBreakdown(data.basicSalary, data.otherAllowances);

  const salaryStructure = await SalaryStructure.findOneAndUpdate(
    { company: companyId, employee: employeeId },
    {
      company: companyId,
      employee: employeeId,
      basicSalary: breakdown.basicSalary,
      hra: breakdown.hra,
      medicalAllowance: breakdown.medicalAllowance,
      otherAllowances: breakdown.otherAllowances,
      grossSalary: breakdown.grossSalary,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
    },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  await logAudit({
    companyId,
    actorId,
    action: 'SET_SALARY_STRUCTURE',
    entityType: 'SalaryStructure',
    entityId: salaryStructure._id,
    details: {
      employeeCode: employee.employeeCode,
      basicSalary: breakdown.basicSalary,
      grossSalary: breakdown.grossSalary,
    },
    req,
  });

  return salaryStructure;
};

export const getSalaryStructure = async (companyId, employeeId) => {
  const salaryStructure = await SalaryStructure.findOne({ company: companyId, employee: employeeId });
  if (!salaryStructure) {
    throw ApiError.notFound('Salary structure not found for this employee');
  }
  return salaryStructure;
};

export const createPayrollDraft = async (companyId, { year, month, notes = '' }, actorId, req = null) => {
  const existingRun = await PayrollRun.findOne({ company: companyId, year, month });
  if (existingRun) {
    if (existingRun.status === PAYROLL_STATUS.FINALIZED) {
      throw ApiError.conflict(`Payroll run for ${year}-${String(month).padStart(2, '0')} has already been finalized and cannot be recreated`);
    } else {
      throw ApiError.conflict(
        `A draft payroll run already exists for ${year}-${String(month).padStart(2, '0')}. Please review or delete the existing draft first.`
      );
    }
  }

  const company = await Company.findById(companyId);
  const weekendDays = company?.settings?.weekendDays || [0, 6];

  // Month date range
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const monthStartStr = formatDateStr(monthStart);
  const monthEndStr = formatDateStr(monthEnd);

  // Month holidays
  const holidays = await Holiday.find({
    company: companyId,
    date: { $gte: monthStartStr, $lte: monthEndStr },
  });

  const { workingDays: standardWorkingDays, workingDateList } = getMonthlyWorkingDays(
    year,
    month,
    weekendDays,
    holidays
  );

  if (standardWorkingDays === 0) {
    throw ApiError.badRequest('No working days found in the selected payroll month');
  }

  // Active employees
  const employees = await Employee.find({ company: companyId, isActive: true })
    .populate('department', 'name code')
    .populate('designation', 'title');

  if (employees.length === 0) {
    throw ApiError.badRequest('No active employees found to run payroll for');
  }

  // Pre-fetch salary structures
  const salaryStructures = await SalaryStructure.find({ company: companyId });
  const salaryMap = new Map(salaryStructures.map((s) => [s.employee.toString(), s]));

  // Pre-fetch attendance for month
  const attendances = await Attendance.find({
    company: companyId,
    date: { $gte: monthStartStr, $lte: monthEndStr },
  });

  // Pre-fetch approved leaves for month
  const leaves = await LeaveRequest.find({
    company: companyId,
    status: LEAVE_STATUS.APPROVED,
    startDate: { $lte: monthEndStr },
    endDate: { $gte: monthStartStr },
  });

  const payrollRun = new PayrollRun({
    company: companyId,
    year,
    month,
    status: PAYROLL_STATUS.DRAFT,
    notes,
  });
  await payrollRun.save();

  const payslipDocs = [];
  let totalGrossSalary = 0;
  let totalDeductions = 0;
  let totalTax = 0;
  let totalNetSalary = 0;

  for (const emp of employees) {
    const empIdStr = emp._id.toString();
    const salary = salaryMap.get(empIdStr);
    if (!salary) continue; // Skip if no salary structure defined yet

    // Handle proration if joined during the month
    let expectedDays = standardWorkingDays;
    let empWorkingDateList = workingDateList;

    if (emp.joiningDate > monthStart) {
      const { workingDays: proratedDays, workingDateList: pList } = calculateWorkingDays(
        emp.joiningDate,
        monthEnd,
        weekendDays,
        holidays
      );
      expectedDays = Math.max(1, proratedDays);
      empWorkingDateList = pList;
    }

    // Filter attendance for this employee
    const empAttendances = attendances.filter((a) => a.employee.toString() === empIdStr);
    const attDateMap = new Map(empAttendances.map((a) => [a.date, a]));

    // Filter approved leaves for this employee
    const empLeaves = leaves.filter((l) => l.employee.toString() === empIdStr);

    let presentDays = 0;
    let halfDays = 0;
    let unpaidLeaveDays = 0;
    let absentDays = 0;

    for (const dStr of empWorkingDateList) {
      const att = attDateMap.get(dStr);
      const leave = empLeaves.find((l) => l.startDate <= dStr && l.endDate >= dStr);

      if (att) {
        if (att.status === ATTENDANCE_STATUS.HALF_DAY) {
          halfDays++;
        } else {
          presentDays++;
        }
      } else if (leave) {
        if (leave.leaveTypeCode === 'UNPAID') {
          unpaidLeaveDays++;
        } else {
          // Paid leave counts as worked/covered day
          presentDays++;
        }
      } else {
        // No attendance record and no approved leave on expected working day
        absentDays++;
      }
    }

    const grossSalary = salary.grossSalary;
    const perDayGross = Math.round((grossSalary / expectedDays) * 100) / 100;

    // Deductions: 1 full day gross for absent and unpaid leave; 0.5 day gross for half day
    const attendanceDeduction = Math.min(
      grossSalary,
      Math.round((absentDays * perDayGross + unpaidLeaveDays * perDayGross + halfDays * 0.5 * perDayGross) * 100) / 100
    );

    const actualWorkingDays = Math.max(0, expectedDays - absentDays - unpaidLeaveDays - halfDays * 0.5);

    // Tax calculation on adjusted gross
    const monthlyGrossAfterDeduction = Math.max(0, grossSalary - attendanceDeduction);
    const annualTaxableGross = monthlyGrossAfterDeduction * 12;
    const annualTax = calculateAnnualTax(annualTaxableGross);
    const monthlyTax = calculateMonthlyTax(annualTaxableGross);

    const netSalary = Math.max(0, Math.round(monthlyGrossAfterDeduction - monthlyTax));

    totalGrossSalary += grossSalary;
    totalDeductions += attendanceDeduction;
    totalTax += monthlyTax;
    totalNetSalary += netSalary;

    payslipDocs.push({
      company: companyId,
      payrollRun: payrollRun._id,
      employee: emp._id,
      year,
      month,
      basicSalary: salary.basicSalary,
      hra: salary.hra,
      medicalAllowance: salary.medicalAllowance,
      otherAllowances: salary.otherAllowances,
      grossSalary,
      expectedWorkingDays: expectedDays,
      actualWorkingDays,
      absentDays,
      halfDays,
      unpaidLeaveDays,
      perDayGross,
      attendanceDeduction,
      annualTaxableGross,
      annualTax,
      monthlyTax,
      otherDeductions: 0,
      netSalary,
      isFinalized: false,
    });
  }

  if (payslipDocs.length === 0) {
    await PayrollRun.findByIdAndDelete(payrollRun._id);
    throw ApiError.badRequest('No employees with configured salary structures were found for payroll processing');
  }

  await Payslip.insertMany(payslipDocs);

  payrollRun.totalGrossSalary = totalGrossSalary;
  payrollRun.totalDeductions = totalDeductions;
  payrollRun.totalTax = totalTax;
  payrollRun.totalNetSalary = totalNetSalary;
  payrollRun.employeeCount = payslipDocs.length;
  await payrollRun.save();

  await logAudit({
    companyId,
    actorId,
    action: 'CREATE_PAYROLL_DRAFT',
    entityType: 'PayrollRun',
    entityId: payrollRun._id,
    details: {
      year,
      month,
      employeeCount: payslipDocs.length,
      totalNetSalary,
    },
    req,
  });

  return payrollRun;
};

export const getPayrollRuns = async (companyId, query = {}) => {
  const { page, limit, skip, sort } = getPaginationParams(query, { defaultSortBy: 'createdAt' });
  const filter = { company: companyId };

  if (query.year) filter.year = Number(query.year);
  if (query.status) filter.status = query.status;

  const [items, totalItems] = await Promise.all([
    PayrollRun.find(filter)
      .populate('finalizedBy', 'email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PayrollRun.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export const getPayrollRunById = async (companyId, runId) => {
  const run = await PayrollRun.findOne({ _id: runId, company: companyId }).populate('finalizedBy', 'email');
  if (!run) {
    throw ApiError.notFound('Payroll run not found');
  }

  const payslips = await Payslip.find({ payrollRun: run._id })
    .populate('employee', 'firstName lastName employeeCode department designation')
    .sort({ 'employee.employeeCode': 1 });

  return {
    payrollRun: run,
    payslips,
  };
};

export const finalizePayrollRun = async (companyId, runId, actorUser, req = null) => {
  // Enforce Section 10: Only Admin can finalize payroll
  if (actorUser.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Only Administrator can finalize payroll');
  }

  const run = await PayrollRun.findOne({ _id: runId, company: companyId });
  if (!run) {
    throw ApiError.notFound('Payroll run not found');
  }

  if (run.status === PAYROLL_STATUS.FINALIZED) {
    throw ApiError.conflict('This payroll run is already finalized and cannot be modified');
  }

  run.status = PAYROLL_STATUS.FINALIZED;
  run.finalizedBy = actorUser._id;
  run.finalizedAt = new Date();
  await run.save();

  // Mark all payslips as finalized
  await Payslip.updateMany({ payrollRun: run._id }, { isFinalized: true });

  // Fetch finalized payslips with employee details to create notifications
  const payslips = await Payslip.find({ payrollRun: run._id }).populate('employee');
  const monthStr = `${run.year}-${String(run.month).padStart(2, '0')}`;

  for (const p of payslips) {
    if (p.employee?.user) {
      await Notification.create({
        company: companyId,
        user: p.employee.user,
        title: `Payslip Available (${monthStr})`,
        message: `Your payslip for ${monthStr} is now finalized and available for download. Net Pay: Rs. ${p.netSalary.toLocaleString()}`,
        type: 'PAYROLL',
        link: `/payroll/payslips/${p._id}`,
      });
    }
  }

  await logAudit({
    companyId,
    actorId: actorUser._id,
    action: 'FINALIZE_PAYROLL',
    entityType: 'PayrollRun',
    entityId: run._id,
    details: {
      year: run.year,
      month: run.month,
      totalNetSalary: run.totalNetSalary,
      employeeCount: run.employeeCount,
    },
    req,
  });

  return run;
};

export const getMyPayslips = async (companyId, employeeId, query = {}) => {
  const filter = {
    company: companyId,
    employee: employeeId,
    isFinalized: true, // Employees can only access finalized payslips
  };

  if (query.year) filter.year = Number(query.year);

  return Payslip.find(filter).sort({ year: -1, month: -1 });
};

export const getPayslipById = async (companyId, payslipId, actorUser) => {
  const payslip = await Payslip.findOne({ _id: payslipId, company: companyId })
    .populate('employee', 'firstName lastName employeeCode email department designation bankDetails')
    .populate('payrollRun', 'status finalizedAt');

  if (!payslip) {
    throw ApiError.notFound('Payslip not found');
  }

  // IDOR & Privacy check: If Employee, must be their own and finalized
  if (actorUser.role === ROLES.EMPLOYEE) {
    if (!actorUser.employee || payslip.employee._id.toString() !== actorUser.employee.toString()) {
      throw ApiError.forbidden('You are not authorized to view this payslip');
    }
    if (!payslip.isFinalized) {
      throw ApiError.notFound('Payslip is not yet finalized');
    }
  }

  return payslip;
};

/**
 * Generates a real PDF stream for a payslip using PDFKit
 */
export const generatePayslipPdf = async (companyId, payslipId, actorUser, res) => {
  const payslip = await getPayslipById(companyId, payslipId, actorUser);
  const company = await Company.findById(companyId);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream directly to response
  const filename = `Payslip_${payslip.employee?.employeeCode}_${payslip.year}_${payslip.month}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(company?.name || 'HCM Lite Enterprise', { align: 'center' });
  doc
    .fontSize(12)
    .font('Helvetica')
    .text('MONTHLY SALARY SLIP', { align: 'center' });
  doc
    .fontSize(10)
    .text(`Period: ${payslip.year}-${String(payslip.month).padStart(2, '0')}`, { align: 'center' });
  doc.moveDown(1.5);

  // Employee details section
  doc.fontSize(10).font('Helvetica-Bold').text('Employee Information');
  doc.font('Helvetica');
  doc.text(`Name: ${payslip.employee?.firstName} ${payslip.employee?.lastName}`);
  doc.text(`Employee Code: ${payslip.employee?.employeeCode}`);
  doc.text(`Email: ${payslip.employee?.email}`);
  doc.moveDown();

  // Attendance summary
  doc.font('Helvetica-Bold').text('Attendance & Working Days');
  doc.font('Helvetica');
  doc.text(`Expected Working Days: ${payslip.expectedWorkingDays}`);
  doc.text(`Actual Working Days: ${payslip.actualWorkingDays}`);
  doc.text(`Absent Days: ${payslip.absentDays}`);
  doc.text(`Half Days: ${payslip.halfDays}`);
  doc.text(`Unpaid Leave Days: ${payslip.unpaidLeaveDays}`);
  doc.moveDown();

  // Table of Earnings and Deductions
  const leftX = 50;
  const rightX = 320;
  let y = doc.y;

  doc.font('Helvetica-Bold').text('EARNINGS', leftX, y);
  doc.text('DEDUCTIONS', rightX, y);
  doc.moveDown(0.5);

  y = doc.y;
  doc.font('Helvetica');
  doc.text(`Basic Salary: Rs. ${payslip.basicSalary.toLocaleString()}`, leftX, y);
  doc.text(`Attendance Deduction: Rs. ${payslip.attendanceDeduction.toLocaleString()}`, rightX, y);
  doc.moveDown();

  y = doc.y;
  doc.text(`House Rent Allowance (HRA): Rs. ${payslip.hra.toLocaleString()}`, leftX, y);
  doc.text(`Income Tax: Rs. ${payslip.monthlyTax.toLocaleString()}`, rightX, y);
  doc.moveDown();

  y = doc.y;
  doc.text(`Medical Allowance: Rs. ${payslip.medicalAllowance.toLocaleString()}`, leftX, y);
  doc.text(`Other Deductions: Rs. ${payslip.otherDeductions.toLocaleString()}`, rightX, y);
  doc.moveDown();

  if (payslip.otherAllowances > 0) {
    y = doc.y;
    doc.text(`Other Allowances: Rs. ${payslip.otherAllowances.toLocaleString()}`, leftX, y);
    doc.moveDown();
  }

  doc.moveDown();
  doc.font('Helvetica-Bold');
  doc.text(`Total Gross Salary: Rs. ${payslip.grossSalary.toLocaleString()}`, leftX);
  const totalDeductions = payslip.attendanceDeduction + payslip.monthlyTax + payslip.otherDeductions;
  doc.text(`Total Deductions: Rs. ${totalDeductions.toLocaleString()}`, rightX, doc.y - 12);
  doc.moveDown(2);

  // Net Pay Box
  doc.rect(50, doc.y, 495, 40).stroke('#2563eb');
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#2563eb')
    .text(`NET PAY: Rs. ${payslip.netSalary.toLocaleString()}`, 65, doc.y + 12);
  doc.moveDown(3);

  // Footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#6b7280')
    .text(
      'This is a system-generated document and does not require a physical signature. Generated by HCM Lite.',
      50,
      750,
      { align: 'center', width: 495 }
    );

  doc.end();
};

export default {
  setSalaryStructure,
  getSalaryStructure,
  createPayrollDraft,
  getPayrollRuns,
  getPayrollRunById,
  finalizePayrollRun,
  getMyPayslips,
  getPayslipById,
  generatePayslipPdf,
};
