import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';

export const createDepartment = async (companyId, data, actorId, req = null) => {
  const existing = await Department.findOne({
    company: companyId,
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
  });

  if (existing) {
    throw ApiError.conflict(`Department with name "${data.name}" already exists`);
  }

  const department = new Department({
    company: companyId,
    name: data.name.trim(),
    code: data.code ? data.code.trim().toUpperCase() : undefined,
    description: data.description ? data.description.trim() : '',
    isActive: true,
  });

  await department.save();

  await logAudit({
    companyId,
    actorId,
    action: 'CREATE_DEPARTMENT',
    entityType: 'Department',
    entityId: department._id,
    details: { name: department.name, code: department.code },
    req,
  });

  return department;
};

export const getDepartments = async (companyId, query = {}) => {
  const filter = { company: companyId };
  if (typeof query.isActive !== 'undefined') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }
  return Department.find(filter).sort({ name: 1 });
};

export const updateDepartment = async (companyId, departmentId, data, actorId, req = null) => {
  const department = await Department.findOne({ _id: departmentId, company: companyId });
  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  if (data.name && data.name.trim().toLowerCase() !== department.name.toLowerCase()) {
    const existing = await Department.findOne({
      company: companyId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
      _id: { $ne: departmentId },
    });
    if (existing) {
      throw ApiError.conflict(`Department with name "${data.name}" already exists`);
    }
    department.name = data.name.trim();
  }

  if (data.code !== undefined) department.code = data.code.trim().toUpperCase();
  if (data.description !== undefined) department.description = data.description.trim();
  if (data.isActive !== undefined) department.isActive = data.isActive;

  await department.save();

  await logAudit({
    companyId,
    actorId,
    action: 'UPDATE_DEPARTMENT',
    entityType: 'Department',
    entityId: department._id,
    details: { name: department.name, isActive: department.isActive },
    req,
  });

  return department;
};

export const deleteDepartment = async (companyId, departmentId, actorId, req = null) => {
  const department = await Department.findOne({ _id: departmentId, company: companyId });
  if (!department) {
    throw ApiError.notFound('Department not found');
  }

  // Prevent deletion if employees are still referencing this department
  const employeeCount = await Employee.countDocuments({ department: departmentId, company: companyId });
  if (employeeCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete department "${department.name}" because ${employeeCount} employee(s) are assigned to it. Reassign employees first or deactivate the department.`
    );
  }

  await Department.findByIdAndDelete(departmentId);

  await logAudit({
    companyId,
    actorId,
    action: 'DELETE_DEPARTMENT',
    entityType: 'Department',
    entityId: departmentId,
    details: { name: department.name },
    req,
  });

  return { message: `Department "${department.name}" deleted successfully` };
};

export default {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};
