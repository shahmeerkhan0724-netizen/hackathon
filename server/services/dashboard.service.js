import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import AttendanceCorrection from '../models/AttendanceCorrection.js';
import SalaryStructure from '../models/SalaryStructure.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import AuditLog from '../models/AuditLog.js';
import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import { ATTENDANCE_STATUS, LEAVE_STATUS, CORRECTION_STATUS, PAYROLL_STATUS } from '../config/constants.js';
import { formatDateStr } from '../utils/workingDays.js';
import { getEmployeeLeaveBalances } from './leave.service.js';

export const getAdminDashboard = async (companyId, query = {}) => {
  const companyObjectId = new mongoose.Types.ObjectId(companyId);

  // 1. Headcount
  const totalEmployees = await Employee.countDocuments({ company: companyObjectId });
  const activeEmployees = await Employee.countDocuments({ company: companyObjectId, isActive: true });
  const inactiveEmployees = totalEmployees - activeEmployees;

  // 2. Headcount by department aggregation
  const headcountByDept = await Employee.aggregate([
    { $match: { company: companyObjectId, isActive: true } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'dept',
      },
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        departmentId: '$_id',
        departmentName: { $ifNull: ['$dept.name', 'Unassigned'] },
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  // 3. Salary analytics
  const salaryAgg = await SalaryStructure.aggregate([
    { $match: { company: companyObjectId } },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossSalary' },
        avgGross: { $avg: '$grossSalary' },
        minGross: { $min: '$grossSalary' },
        maxGross: { $max: '$grossSalary' },
        count: { $sum: 1 },
      },
    },
  ]);

  const salaryStats = salaryAgg[0] || {
    totalGross: 0,
    avgGross: 0,
    minGross: 0,
    maxGross: 0,
    count: 0,
  };

  // 4. Payroll cost by department
  const payrollByDept = await SalaryStructure.aggregate([
    { $match: { company: companyObjectId } },
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'emp',
      },
    },
    { $unwind: '$emp' },
    { $match: { 'emp.isActive': true } },
    {
      $group: {
        _id: '$emp.department',
        totalPayrollCost: { $sum: '$grossSalary' },
        employeeCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'dept',
      },
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        departmentId: '$_id',
        departmentName: { $ifNull: ['$dept.name', 'Unassigned'] },
        totalPayrollCost: 1,
        employeeCount: 1,
      },
    },
    { $sort: { totalPayrollCost: -1 } },
  ]);

  // 5. Recent payroll run
  const latestPayrollRun = await PayrollRun.findOne({ company: companyObjectId })
    .sort({ year: -1, month: -1 });

  // 6. Recent audit log feed
  const recentAudit = await AuditLog.find({ company: companyObjectId })
    .populate('actor', 'email role')
    .sort({ timestamp: -1 })
    .limit(10);

  return {
    overview: {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      monthlyPayrollEstimate: salaryStats.totalGross,
      averageSalary: Math.round(salaryStats.avgGross),
      employeesWithSalaryConfigured: salaryStats.count,
    },
    headcountByDepartment: headcountByDept,
    payrollByDepartment: payrollByDept,
    latestPayrollRun,
    recentAuditLogs: recentAudit,
  };
};

export const getHRDashboard = async (companyId, query = {}) => {
  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const todayStr = formatDateStr(new Date());

  // 1. Active headcount
  const activeEmployeesCount = await Employee.countDocuments({ company: companyObjectId, isActive: true });

  // 2. Today's attendance
  const todayAttendance = await Attendance.find({ company: companyObjectId, date: todayStr });
  let presentToday = 0;
  let lateToday = 0;
  let halfDayToday = 0;

  for (const a of todayAttendance) {
    if (a.status === ATTENDANCE_STATUS.PRESENT) presentToday++;
    else if (a.status === ATTENDANCE_STATUS.LATE) lateToday++;
    else if (a.status === ATTENDANCE_STATUS.HALF_DAY) halfDayToday++;
  }

  // Today on leave
  const onLeaveToday = await LeaveRequest.countDocuments({
    company: companyObjectId,
    status: LEAVE_STATUS.APPROVED,
    startDate: { $lte: todayStr },
    endDate: { $gte: todayStr },
  });

  // Pending approvals
  const pendingLeaves = await LeaveRequest.countDocuments({
    company: companyObjectId,
    status: LEAVE_STATUS.PENDING,
  });

  const pendingCorrections = await AttendanceCorrection.countDocuments({
    company: companyObjectId,
    status: CORRECTION_STATUS.PENDING,
  });

  // 3. Top 5 Late Comers this month
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const topLateComers = await Attendance.aggregate([
    {
      $match: {
        company: companyObjectId,
        date: { $regex: `^${currentMonthStr}` },
        status: ATTENDANCE_STATUS.LATE,
      },
    },
    {
      $group: {
        _id: '$employee',
        lateCount: { $sum: 1 },
        totalLateMinutes: { $sum: '$lateMinutes' },
      },
    },
    { $sort: { lateCount: -1, totalLateMinutes: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'emp',
      },
    },
    { $unwind: '$emp' },
    {
      $project: {
        employeeId: '$_id',
        employeeCode: '$emp.employeeCode',
        fullName: { $concat: ['$emp.firstName', ' ', '$emp.lastName'] },
        lateCount: 1,
        totalLateMinutes: 1,
      },
    },
  ]);

  // 4. Leave usage by type (this year)
  const currentYear = new Date().getFullYear();
  const leaveUsageByType = await LeaveRequest.aggregate([
    {
      $match: {
        company: companyObjectId,
        status: LEAVE_STATUS.APPROVED,
        startDate: { $regex: `^${currentYear}` },
      },
    },
    {
      $group: {
        _id: '$leaveTypeCode',
        totalDays: { $sum: '$daysCount' },
        requestCount: { $sum: 1 },
      },
    },
    { $sort: { totalDays: -1 } },
  ]);

  // 5. 7-Day Attendance Trend
  const trendDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendDays.push(formatDateStr(d));
  }

  const past7DaysAttendance = await Attendance.find({
    company: companyObjectId,
    date: { $in: trendDays },
  });

  const attendanceTrend = trendDays.map((dateStr) => {
    const dayRecords = past7DaysAttendance.filter((r) => r.date === dateStr);
    return {
      date: dateStr,
      present: dayRecords.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length,
      late: dayRecords.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
      halfDay: dayRecords.filter((r) => r.status === ATTENDANCE_STATUS.HALF_DAY).length,
      totalCheckedIn: dayRecords.length,
    };
  });

  return {
    today: {
      date: todayStr,
      totalActiveEmployees: activeEmployeesCount,
      present: presentToday,
      late: lateToday,
      halfDay: halfDayToday,
      onLeave: onLeaveToday,
    },
    pendingApprovals: {
      leaveRequests: pendingLeaves,
      attendanceCorrections: pendingCorrections,
      total: pendingLeaves + pendingCorrections,
    },
    topLateComers,
    leaveUsageByType,
    attendanceTrend,
  };
};

export const getEmployeeDashboard = async (companyId, employeeId, userId) => {
  const todayStr = formatDateStr(new Date());

  // 1. Today's attendance
  const todayAttendance = await Attendance.findOne({
    company: companyId,
    employee: employeeId,
    date: todayStr,
  });

  // 2. Hours worked this week (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  const mondayStr = formatDateStr(monday);

  const weekRecords = await Attendance.find({
    company: companyId,
    employee: employeeId,
    date: { $gte: mondayStr, $lte: todayStr },
  });

  const totalWeekMinutes = weekRecords.reduce((sum, r) => sum + (r.totalWorkMinutes || 0), 0);
  const totalWeekHours = (totalWeekMinutes / 60).toFixed(1);

  // 3. Late count this month
  const currentMonthStr = todayStr.substring(0, 7);
  const monthLateCount = await Attendance.countDocuments({
    company: companyId,
    employee: employeeId,
    date: { $regex: `^${currentMonthStr}` },
    status: ATTENDANCE_STATUS.LATE,
  });

  // 4. Leave balances
  const leaveBalances = await getEmployeeLeaveBalances(companyId, employeeId);

  // 5. Last finalized payslip
  const latestPayslip = await Payslip.findOne({
    company: companyId,
    employee: employeeId,
    isFinalized: true,
  }).sort({ year: -1, month: -1 });

  // 6. Recent announcements
  const announcements = await Announcement.find({ company: companyId })
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(5);

  // 7. Unread notifications count
  const unreadNotificationsCount = await Notification.countDocuments({
    company: companyId,
    user: userId,
    isRead: false,
  });

  return {
    todayStatus: {
      date: todayStr,
      isCheckedIn: Boolean(todayAttendance?.checkIn),
      checkInTime: todayAttendance?.checkIn || null,
      isCheckedOut: Boolean(todayAttendance?.checkOut),
      checkOutTime: todayAttendance?.checkOut || null,
      status: todayAttendance?.status || 'NOT_CHECKED_IN',
      lateMinutes: todayAttendance?.lateMinutes || 0,
    },
    hoursWorkedThisWeek: Number(totalWeekHours),
    monthLateCount,
    leaveBalances,
    latestPayslip: latestPayslip || null,
    recentAnnouncements: announcements,
    unreadNotificationsCount,
  };
};

export default {
  getAdminDashboard,
  getHRDashboard,
  getEmployeeDashboard,
};
