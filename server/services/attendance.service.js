import Attendance from '../models/Attendance.js';
import AttendanceCorrection from '../models/AttendanceCorrection.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Holiday from '../models/Holiday.js';
import Notification from '../models/Notification.js';
import { ATTENDANCE_STATUS, CORRECTION_STATUS, ROLES, LEAVE_STATUS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { formatDateStr, isWeekend } from '../utils/workingDays.js';
import { logAudit } from '../utils/audit.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

/**
 * Parses "HH:MM" string to minutes from start of day
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const checkIn = async (companyId, employeeId, note = '', req = null) => {
  const now = new Date();
  const todayStr = formatDateStr(now);

  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');

  // Check if today is weekend or holiday
  const weekendDays = company.settings.weekendDays || [0, 6];
  if (isWeekend(now, weekendDays)) {
    // Optionally allow check-in on weekend or log warning
  }

  // Check for duplicate check-in today
  const existing = await Attendance.findOne({
    company: companyId,
    employee: employeeId,
    date: todayStr,
  });

  if (existing && existing.checkIn) {
    throw ApiError.conflict('You have already checked in for today');
  }

  // Calculate late status
  const officeStartMinutes = timeToMinutes(company.settings.officeStartTime || '09:00');
  const graceMinutes = company.settings.gracePeriodMinutes ?? 15;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isLate = currentMinutes > officeStartMinutes + graceMinutes;
  const lateMinutes = isLate ? currentMinutes - officeStartMinutes : 0;
  const status = isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;

  let attendance;
  if (existing) {
    existing.checkIn = now;
    existing.status = status;
    existing.lateMinutes = lateMinutes;
    if (note) existing.checkInNote = note.trim();
    attendance = await existing.save();
  } else {
    attendance = new Attendance({
      company: companyId,
      employee: employeeId,
      date: todayStr,
      checkIn: now,
      status,
      lateMinutes,
      checkInNote: note ? note.trim() : '',
    });
    try {
      await attendance.save();
    } catch (err) {
      if (err.code === 11000) {
        throw ApiError.conflict('Duplicate check-in detected for today');
      }
      throw err;
    }
  }

  return {
    attendance,
    message: isLate
      ? `Checked in successfully (Late by ${lateMinutes} minutes)`
      : 'Checked in on time successfully',
  };
};

export const checkOut = async (companyId, employeeId, note = '', req = null) => {
  const now = new Date();
  const todayStr = formatDateStr(now);

  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');

  const attendance = await Attendance.findOne({
    company: companyId,
    employee: employeeId,
    date: todayStr,
  });

  if (!attendance || !attendance.checkIn) {
    throw ApiError.badRequest('You must check in before checking out');
  }

  if (attendance.checkOut) {
    throw ApiError.conflict('You have already checked out for today');
  }

  if (now <= attendance.checkIn) {
    throw ApiError.badRequest('Check-out time cannot be earlier than or equal to check-in time');
  }

  attendance.checkOut = now;
  if (note) attendance.checkOutNote = note.trim();

  // Calculate total work minutes
  const diffMs = now.getTime() - attendance.checkIn.getTime();
  const totalMinutes = Math.round(diffMs / (1000 * 60));
  attendance.totalWorkMinutes = totalMinutes;

  // Check half-day threshold
  const halfDayThresholdMinutes = (company.settings.halfDayHours || 5) * 60;
  if (totalMinutes < halfDayThresholdMinutes) {
    attendance.status = ATTENDANCE_STATUS.HALF_DAY;
  }

  await attendance.save();

  const workedHours = (totalMinutes / 60).toFixed(1);
  return {
    attendance,
    message: `Checked out successfully. Total worked: ${workedHours} hours.`,
  };
};

export const getMyAttendance = async (companyId, employeeId, query = {}) => {
  const filter = { company: companyId, employee: employeeId };

  if (query.month && query.year) {
    const m = String(query.month).padStart(2, '0');
    const y = String(query.year);
    filter.date = { $regex: new RegExp(`^${y}-${m}`) };
  } else if (query.startDate && query.endDate) {
    filter.date = { $gte: query.startDate, $lte: query.endDate };
  }

  return Attendance.find(filter).sort({ date: -1 });
};

export const getDailyAttendanceBoard = async (companyId, dateStr = formatDateStr(new Date())) => {
  const company = await Company.findById(companyId);
  const weekendDays = company?.settings?.weekendDays || [0, 6];
  const targetDate = new Date(dateStr);
  const isWeekendDay = isWeekend(targetDate, weekendDays);
  const isHolidayDay = await Holiday.exists({ company: companyId, date: dateStr });

  // Get all active employees
  const employees = await Employee.find({ company: companyId, isActive: true })
    .populate('department', 'name code')
    .populate('designation', 'title');

  // Get all attendance records for date
  const attendanceRecords = await Attendance.find({ company: companyId, date: dateStr });
  const attendanceMap = new Map(attendanceRecords.map((a) => [a.employee.toString(), a]));

  // Get approved leaves covering date
  const approvedLeaves = await LeaveRequest.find({
    company: companyId,
    status: LEAVE_STATUS.APPROVED,
    startDate: { $lte: dateStr },
    endDate: { $gte: dateStr },
  }).populate('leaveType', 'name code');
  const leaveMap = new Map(approvedLeaves.map((l) => [l.employee.toString(), l]));

  let presentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let onLeaveCount = 0;
  let absentCount = 0;

  const roster = employees.map((emp) => {
    const empIdStr = emp._id.toString();
    const att = attendanceMap.get(empIdStr);
    const leave = leaveMap.get(empIdStr);

    let status = ATTENDANCE_STATUS.ABSENT;

    if (att) {
      status = att.status;
      if (status === ATTENDANCE_STATUS.PRESENT) presentCount++;
      else if (status === ATTENDANCE_STATUS.LATE) lateCount++;
      else if (status === ATTENDANCE_STATUS.HALF_DAY) halfDayCount++;
    } else if (leave) {
      status = ATTENDANCE_STATUS.ON_LEAVE;
      onLeaveCount++;
    } else {
      if (!isWeekendDay && !isHolidayDay) {
        absentCount++;
      } else {
        status = isHolidayDay ? 'HOLIDAY' : 'WEEKEND';
      }
    }

    return {
      employee: {
        id: emp._id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
      },
      date: dateStr,
      attendance: att || null,
      leave: leave
        ? {
            leaveTypeCode: leave.leaveTypeCode,
            leaveTypeName: leave.leaveType?.name,
            reason: leave.reason,
          }
        : null,
      status,
    };
  });

  return {
    date: dateStr,
    isWeekend: isWeekendDay,
    isHoliday: Boolean(isHolidayDay),
    summary: {
      totalEmployees: employees.length,
      present: presentCount,
      late: lateCount,
      halfDay: halfDayCount,
      onLeave: onLeaveCount,
      absent: absentCount,
    },
    roster,
  };
};

export const requestCorrection = async (companyId, employeeId, data, req = null) => {
  const reqCheckIn = new Date(data.requestedCheckIn);
  const reqCheckOut = data.requestedCheckOut ? new Date(data.requestedCheckOut) : null;

  if (reqCheckOut && reqCheckOut <= reqCheckIn) {
    throw ApiError.badRequest('Requested check-out time must be after check-in time');
  }

  // Find attendance record for date if any
  const attendance = await Attendance.findOne({
    company: companyId,
    employee: employeeId,
    date: data.date,
  });

  const existingPending = await AttendanceCorrection.findOne({
    company: companyId,
    employee: employeeId,
    date: data.date,
    status: CORRECTION_STATUS.PENDING,
  });

  if (existingPending) {
    throw ApiError.conflict('You already have a pending correction request for this date');
  }

  const correction = new AttendanceCorrection({
    company: companyId,
    employee: employeeId,
    attendance: attendance?._id || null,
    date: data.date,
    requestedCheckIn: reqCheckIn,
    requestedCheckOut: reqCheckOut,
    reason: data.reason.trim(),
    status: CORRECTION_STATUS.PENDING,
  });

  await correction.save();

  return correction;
};

export const getCorrections = async (companyId, query = {}, actorUser) => {
  const { page, limit, skip, sort } = getPaginationParams(query, { defaultSortBy: 'createdAt' });
  const filter = { company: companyId };

  if (actorUser.role === ROLES.EMPLOYEE) {
    filter.employee = actorUser.employee;
  } else if (query.employeeId) {
    filter.employee = query.employeeId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  const [items, totalItems] = await Promise.all([
    AttendanceCorrection.find(filter)
      .populate('employee', 'firstName lastName employeeCode')
      .populate('decidedBy', 'email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    AttendanceCorrection.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export const decideCorrection = async (companyId, correctionId, decisionData, actorUser, req = null) => {
  // Only HR can decide correction requests as per Section 8
  if (actorUser.role !== ROLES.HR) {
    throw ApiError.forbidden('Only HR personnel can approve or reject attendance correction requests');
  }

  const correction = await AttendanceCorrection.findOne({ _id: correctionId, company: companyId });
  if (!correction) {
    throw ApiError.notFound('Correction request not found');
  }

  if (correction.status !== CORRECTION_STATUS.PENDING) {
    throw ApiError.conflict(`Correction request is already ${correction.status.toLowerCase()}`);
  }

  correction.status = decisionData.status;
  correction.decisionNote = decisionData.decisionNote ? decisionData.decisionNote.trim() : '';
  correction.decidedBy = actorUser._id;
  correction.decidedAt = new Date();
  await correction.save();

  // If approved, update attendance record
  if (decisionData.status === CORRECTION_STATUS.APPROVED) {
    const company = await Company.findById(companyId);
    const officeStartMinutes = timeToMinutes(company.settings.officeStartTime || '09:00');
    const graceMinutes = company.settings.gracePeriodMinutes ?? 15;

    const inTime = correction.requestedCheckIn;
    const outTime = correction.requestedCheckOut;
    const currentMinutes = inTime.getHours() * 60 + inTime.getMinutes();
    const isLate = currentMinutes > officeStartMinutes + graceMinutes;
    const lateMinutes = isLate ? currentMinutes - officeStartMinutes : 0;

    let totalWorkMinutes = 0;
    let status = isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;

    if (outTime) {
      const diffMs = outTime.getTime() - inTime.getTime();
      totalWorkMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
      const halfDayThreshold = (company.settings.halfDayHours || 5) * 60;
      if (totalWorkMinutes < halfDayThreshold) {
        status = ATTENDANCE_STATUS.HALF_DAY;
      }
    }

    await Attendance.findOneAndUpdate(
      { company: companyId, employee: correction.employee, date: correction.date },
      {
        company: companyId,
        employee: correction.employee,
        date: correction.date,
        checkIn: inTime,
        checkOut: outTime,
        status,
        lateMinutes,
        totalWorkMinutes,
        isCorrectionApplied: true,
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // Create notification for employee
  const employee = await Employee.findById(correction.employee);
  if (employee?.user) {
    await Notification.create({
      company: companyId,
      user: employee.user,
      title: `Attendance Correction ${decisionData.status}`,
      message: `Your attendance correction request for ${correction.date} has been ${decisionData.status.toLowerCase()}${
        correction.decisionNote ? `: ${correction.decisionNote}` : '.'
      }`,
      type: 'ATTENDANCE',
    });
  }

  await logAudit({
    companyId,
    actorId: actorUser._id,
    action: `ATTENDANCE_CORRECTION_${decisionData.status}`,
    entityType: 'AttendanceCorrection',
    entityId: correction._id,
    details: {
      date: correction.date,
      status: decisionData.status,
      decisionNote: correction.decisionNote,
    },
    req,
  });

  return correction;
};

export default {
  checkIn,
  checkOut,
  getMyAttendance,
  getDailyAttendanceBoard,
  requestCorrection,
  getCorrections,
  decideCorrection,
};
