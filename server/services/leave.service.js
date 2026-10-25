import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import Holiday from '../models/Holiday.js';
import Notification from '../models/Notification.js';
import { LEAVE_STATUS, ROLES } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { calculateWorkingDays } from '../utils/workingDays.js';
import { logAudit } from '../utils/audit.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

/**
 * Calculates current leave balance for an employee across all configured leave types
 */
export const getEmployeeLeaveBalances = async (companyId, employeeId) => {
  const currentYear = new Date().getFullYear();
  const yearStartStr = `${currentYear}-01-01`;
  const yearEndStr = `${currentYear}-12-31`;

  const leaveTypes = await LeaveType.find({ company: companyId, isActive: true });

  // Get all approved leaves for this year
  const approvedLeaves = await LeaveRequest.find({
    company: companyId,
    employee: employeeId,
    status: LEAVE_STATUS.APPROVED,
    startDate: { $gte: yearStartStr, $lte: yearEndStr },
  });

  const usedMap = new Map();
  for (const l of approvedLeaves) {
    const code = l.leaveTypeCode.toUpperCase();
    usedMap.set(code, (usedMap.get(code) || 0) + l.daysCount);
  }

  const balances = leaveTypes.map((lt) => {
    const code = lt.code.toUpperCase();
    const used = usedMap.get(code) || 0;
    const quota = lt.isUnlimited ? null : lt.daysPerYear;
    const remaining = lt.isUnlimited ? null : Math.max(0, quota - used);

    return {
      leaveTypeId: lt._id,
      name: lt.name,
      code,
      quota,
      used,
      remaining,
      isUnlimited: lt.isUnlimited,
      isPaid: lt.isPaid,
    };
  });

  return balances;
};

export const applyLeave = async (companyId, employeeId, data, req = null) => {
  const { leaveTypeCode, startDate, endDate, reason } = data;

  if (startDate > endDate) {
    throw ApiError.badRequest('Start date cannot be after end date');
  }

  const code = leaveTypeCode.trim().toUpperCase();
  const leaveType = await LeaveType.findOne({ company: companyId, code, isActive: true });
  if (!leaveType) {
    throw ApiError.badRequest(`Leave type "${code}" does not exist or is inactive`);
  }

  const company = await Company.findById(companyId);
  const weekendDays = company?.settings?.weekendDays || [0, 6];

  // Fetch holidays between startDate and endDate
  const holidays = await Holiday.find({
    company: companyId,
    date: { $gte: startDate, $lte: endDate },
  });

  // Calculate working days
  const { workingDays } = calculateWorkingDays(startDate, endDate, weekendDays, holidays);

  if (workingDays === 0) {
    throw ApiError.badRequest(
      'Selected date range contains no working days (all selected dates fall on weekends or company holidays)'
    );
  }

  // Check for overlapping pending or approved leaves
  const overlapping = await LeaveRequest.findOne({
    company: companyId,
    employee: employeeId,
    status: { $in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  });

  if (overlapping) {
    throw ApiError.conflict(
      `You already have a ${overlapping.status.toLowerCase()} leave request (${overlapping.leaveTypeCode}) overlapping from ${overlapping.startDate} to ${overlapping.endDate}`
    );
  }

  // Quota check (if not unlimited)
  if (!leaveType.isUnlimited) {
    const balances = await getEmployeeLeaveBalances(companyId, employeeId);
    const typeBalance = balances.find((b) => b.code === code);
    const available = typeBalance ? typeBalance.remaining : 0;

    if (workingDays > available) {
      throw ApiError.badRequest(
        `Insufficient leave quota for ${leaveType.name}. Requested: ${workingDays} day(s), Available: ${available} day(s).`
      );
    }
  }

  const leaveRequest = new LeaveRequest({
    company: companyId,
    employee: employeeId,
    leaveType: leaveType._id,
    leaveTypeCode: code,
    startDate,
    endDate,
    daysCount: workingDays,
    reason: reason.trim(),
    status: LEAVE_STATUS.PENDING,
  });

  await leaveRequest.save();

  return {
    leaveRequest,
    message: `Leave request submitted successfully for ${workingDays} working day(s).`,
  };
};

export const getMyLeaves = async (companyId, employeeId, query = {}) => {
  const { page, limit, skip, sort } = getPaginationParams(query, { defaultSortBy: 'createdAt' });
  const filter = { company: companyId, employee: employeeId };

  if (query.status) {
    filter.status = query.status;
  }

  const [items, totalItems] = await Promise.all([
    LeaveRequest.find(filter)
      .populate('leaveType', 'name code isPaid')
      .populate('decidedBy', 'email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export const getAllLeaves = async (companyId, query = {}) => {
  const { page, limit, skip, sort } = getPaginationParams(query, { defaultSortBy: 'createdAt' });
  const filter = { company: companyId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.employeeId) {
    filter.employee = query.employeeId;
  }

  if (query.leaveTypeCode) {
    filter.leaveTypeCode = query.leaveTypeCode.toUpperCase();
  }

  const [items, totalItems] = await Promise.all([
    LeaveRequest.find(filter)
      .populate('employee', 'firstName lastName employeeCode')
      .populate('leaveType', 'name code isPaid')
      .populate('decidedBy', 'email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export const cancelLeave = async (companyId, employeeId, leaveId, req = null) => {
  const leave = await LeaveRequest.findOne({ _id: leaveId, company: companyId, employee: employeeId });
  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }

  if (leave.status !== LEAVE_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot cancel leave request that is already ${leave.status.toLowerCase()}`);
  }

  leave.status = LEAVE_STATUS.CANCELLED;
  leave.cancelledAt = new Date();
  await leave.save();

  return { message: 'Leave request cancelled successfully', leave };
};

export const decideLeave = async (companyId, leaveId, decisionData, actorUser, req = null) => {
  // Only HR can decide leave requests as per Section 9
  if (actorUser.role !== ROLES.HR) {
    throw ApiError.forbidden('Only HR personnel can approve or reject leave requests');
  }

  // Prevent race conditions: find and update atomically where status is PENDING
  const leave = await LeaveRequest.findOneAndUpdate(
    { _id: leaveId, company: companyId, status: LEAVE_STATUS.PENDING },
    {
      status: decisionData.status,
      decisionNote: decisionData.decisionNote ? decisionData.decisionNote.trim() : '',
      decidedBy: actorUser._id,
      decidedAt: new Date(),
    },
    { returnDocument: 'after' }
  ).populate('leaveType employee');

  if (!leave) {
    // Check if it already exists with another status
    const existing = await LeaveRequest.findOne({ _id: leaveId, company: companyId });
    if (!existing) {
      throw ApiError.notFound('Leave request not found');
    }
    throw ApiError.conflict(`Leave request is already ${existing.status.toLowerCase()}`);
  }

  // Send Notification to Employee
  if (leave.employee?.user) {
    await Notification.create({
      company: companyId,
      user: leave.employee.user,
      title: `Leave Request ${decisionData.status}`,
      message: `Your ${leave.leaveTypeCode} leave request for ${leave.startDate} to ${leave.endDate} has been ${decisionData.status.toLowerCase()}${
        leave.decisionNote ? `: ${leave.decisionNote}` : '.'
      }`,
      type: 'LEAVE',
    });
  }

  await logAudit({
    companyId,
    actorId: actorUser._id,
    action: `LEAVE_${decisionData.status}`,
    entityType: 'LeaveRequest',
    entityId: leave._id,
    details: {
      employeeCode: leave.employee?.employeeCode,
      leaveType: leave.leaveTypeCode,
      daysCount: leave.daysCount,
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: decisionData.status,
    },
    req,
  });

  return leave;
};

export default {
  getEmployeeLeaveBalances,
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  cancelLeave,
  decideLeave,
};
