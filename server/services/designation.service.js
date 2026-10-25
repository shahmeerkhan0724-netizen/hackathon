import Designation from '../models/Designation.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';

export const createDesignation = async (companyId, data, actorId, req = null) => {
  const existing = await Designation.findOne({
    company: companyId,
    title: { $regex: new RegExp(`^${data.title.trim()}$`, 'i') },
  });

  if (existing) {
    throw ApiError.conflict(`Designation with title "${data.title}" already exists`);
  }

  if (data.department) {
    const dept = await Department.findOne({ _id: data.department, company: companyId });
    if (!dept) {
      throw ApiError.badRequest('Referenced department does not exist in this company');
    }
  }

  const designation = new Designation({
    company: companyId,
    title: data.title.trim(),
    department: data.department || null,
    description: data.description ? data.description.trim() : '',
    isActive: true,
  });

  await designation.save();

  await logAudit({
    companyId,
    actorId,
    action: 'CREATE_DESIGNATION',
    entityType: 'Designation',
    entityId: designation._id,
    details: { title: designation.title },
    req,
  });

  return designation;
};

export const getDesignations = async (companyId, query = {}) => {
  const filter = { company: companyId };
  if (query.department) {
    filter.department = query.department;
  }
  if (typeof query.isActive !== 'undefined') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }
  return Designation.find(filter).populate('department', 'name code').sort({ title: 1 });
};

export const updateDesignation = async (companyId, designationId, data, actorId, req = null) => {
  const designation = await Designation.findOne({ _id: designationId, company: companyId });
  if (!designation) {
    throw ApiError.notFound('Designation not found');
  }

  if (data.title && data.title.trim().toLowerCase() !== designation.title.toLowerCase()) {
    const existing = await Designation.findOne({
      company: companyId,
      title: { $regex: new RegExp(`^${data.title.trim()}$`, 'i') },
      _id: { $ne: designationId },
    });
    if (existing) {
      throw ApiError.conflict(`Designation with title "${data.title}" already exists`);
    }
    designation.title = data.title.trim();
  }

  if (data.department !== undefined) {
    if (data.department) {
      const dept = await Department.findOne({ _id: data.department, company: companyId });
      if (!dept) throw ApiError.badRequest('Referenced department does not exist');
      designation.department = dept._id;
    } else {
      designation.department = null;
    }
  }

  if (data.description !== undefined) designation.description = data.description.trim();
  if (data.isActive !== undefined) designation.isActive = data.isActive;

  await designation.save();

  await logAudit({
    companyId,
    actorId,
    action: 'UPDATE_DESIGNATION',
    entityType: 'Designation',
    entityId: designation._id,
    details: { title: designation.title, isActive: designation.isActive },
    req,
  });

  return designation;
};

export const deleteDesignation = async (companyId, designationId, actorId, req = null) => {
  const designation = await Designation.findOne({ _id: designationId, company: companyId });
  if (!designation) {
    throw ApiError.notFound('Designation not found');
  }

  const employeeCount = await Employee.countDocuments({ designation: designationId, company: companyId });
  if (employeeCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete designation "${designation.title}" because ${employeeCount} employee(s) have this designation. Reassign employees first or deactivate the designation.`
    );
  }

  await Designation.findByIdAndDelete(designationId);

  await logAudit({
    companyId,
    actorId,
    action: 'DELETE_DESIGNATION',
    entityType: 'Designation',
    entityId: designationId,
    details: { title: designation.title },
    req,
  });

  return { message: `Designation "${designation.title}" deleted successfully` };
};

export default {
  createDesignation,
  getDesignations,
  updateDesignation,
  deleteDesignation,
};
