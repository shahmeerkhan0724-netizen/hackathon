import LeaveType from '../models/LeaveType.js';
import LeaveRequest from '../models/LeaveRequest.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';

export const createLeaveType = async (companyId, data, actorId, req = null) => {
  const code = data.code.trim().toUpperCase();
  const existing = await LeaveType.findOne({ company: companyId, code });
  if (existing) {
    throw ApiError.conflict(`Leave type with code "${code}" already exists`);
  }

  const leaveType = new LeaveType({
    company: companyId,
    name: data.name.trim(),
    code,
    daysPerYear: data.isUnlimited ? 0 : data.daysPerYear,
    isPaid: data.isPaid !== undefined ? data.isPaid : true,
    isUnlimited: Boolean(data.isUnlimited),
    description: data.description ? data.description.trim() : '',
    isActive: true,
  });

  await leaveType.save();

  await logAudit({
    companyId,
    actorId,
    action: 'CREATE_LEAVE_TYPE',
    entityType: 'LeaveType',
    entityId: leaveType._id,
    details: { code: leaveType.code, daysPerYear: leaveType.daysPerYear },
    req,
  });

  return leaveType;
};

export const getLeaveTypes = async (companyId, query = {}) => {
  const filter = { company: companyId };
  if (typeof query.isActive !== 'undefined') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }
  return LeaveType.find(filter).sort({ name: 1 });
};

export const updateLeaveType = async (companyId, leaveTypeId, data, actorId, req = null) => {
  const leaveType = await LeaveType.findOne({ _id: leaveTypeId, company: companyId });
  if (!leaveType) {
    throw ApiError.notFound('Leave type not found');
  }

  if (data.name) leaveType.name = data.name.trim();
  if (data.daysPerYear !== undefined) leaveType.daysPerYear = data.daysPerYear;
  if (data.isPaid !== undefined) leaveType.isPaid = data.isPaid;
  if (data.isUnlimited !== undefined) {
    leaveType.isUnlimited = data.isUnlimited;
    if (data.isUnlimited) leaveType.daysPerYear = 0;
  }
  if (data.description !== undefined) leaveType.description = data.description.trim();
  if (data.isActive !== undefined) leaveType.isActive = data.isActive;

  await leaveType.save();

  await logAudit({
    companyId,
    actorId,
    action: 'UPDATE_LEAVE_TYPE',
    entityType: 'LeaveType',
    entityId: leaveType._id,
    details: { code: leaveType.code, daysPerYear: leaveType.daysPerYear, isActive: leaveType.isActive },
    req,
  });

  return leaveType;
};

export const deleteLeaveType = async (companyId, leaveTypeId, actorId, req = null) => {
  const leaveType = await LeaveType.findOne({ _id: leaveTypeId, company: companyId });
  if (!leaveType) {
    throw ApiError.notFound('Leave type not found');
  }

  const existingRequests = await LeaveRequest.countDocuments({
    company: companyId,
    leaveType: leaveTypeId,
  });

  if (existingRequests > 0) {
    throw ApiError.badRequest(
      `Cannot delete leave type "${leaveType.name}" because it has ${existingRequests} historical request(s). Consider deactivating it instead.`
    );
  }

  await LeaveType.findByIdAndDelete(leaveTypeId);

  await logAudit({
    companyId,
    actorId,
    action: 'DELETE_LEAVE_TYPE',
    entityType: 'LeaveType',
    entityId: leaveTypeId,
    details: { code: leaveType.code },
    req,
  });

  return { message: `Leave type "${leaveType.name}" deleted successfully` };
};

export default {
  createLeaveType,
  getLeaveTypes,
  updateLeaveType,
  deleteLeaveType,
};
