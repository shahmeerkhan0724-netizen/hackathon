import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import { ROLES } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { logAudit } from '../utils/audit.js';

export const login = async (emailOrPayload, maybePassword, req = null) => {
  let email;
  let password;

  if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
    email = emailOrPayload.email || emailOrPayload.adminEmail || emailOrPayload.username;
    password = emailOrPayload.password || emailOrPayload.adminPassword;
  } else {
    email = emailOrPayload;
    password = maybePassword;
  }

  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail || !password) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const user = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
    ],
  }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact your administrator.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  // Find linked employee if any
  let employee = null;
  if (user.employee) {
    employee = await Employee.findById(user.employee).populate('department designation');
  } else {
    employee = await Employee.findOne({ user: user._id, company: user.company }).populate('department designation');
  }

  const company = await Company.findById(user.company);

  const token = generateToken({
    id: user._id,
    role: user.role,
    companyId: user.company,
    employeeId: employee?._id || null,
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      company: {
        id: company?._id,
        name: company?.name,
        settings: company?.settings,
      },
      employee: employee
        ? {
            id: employee._id,
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            firstName: employee.firstName,
            lastName: employee.lastName,
            department: employee.department,
            designation: employee.designation,
          }
        : null,
    },
    token,
  };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const company = await Company.findById(user.company);
  let employee = null;

  if (user.employee) {
    employee = await Employee.findById(user.employee).populate('department designation');
  } else {
    employee = await Employee.findOne({ user: user._id, company: user.company }).populate('department designation');
  }

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    company: {
      id: company?._id,
      name: company?.name,
      settings: company?.settings,
    },
    employee: employee
      ? {
          id: employee._id,
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
          address: employee.address,
          joiningDate: employee.joiningDate,
          employmentStatus: employee.employmentStatus,
          department: employee.department,
          designation: employee.designation,
          bankDetails: employee.bankDetails,
          emergencyContact: employee.emergencyContact,
        }
      : null,
  };
};

export const changePassword = async (userId, currentPassword, newPassword, req = null) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password does not match');
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  await logAudit({
    companyId: user.company,
    actorId: user._id,
    action: 'CHANGE_PASSWORD',
    entityType: 'User',
    entityId: user._id,
    details: { email: user.email },
    req,
  });

  return { message: 'Password changed successfully' };
};

export const resetPassword = async (actorUser, targetUserId, newPassword, req = null) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw ApiError.notFound('Target user not found');
  }

  if (targetUser.company.toString() !== actorUser.company.toString()) {
    throw ApiError.forbidden('Cannot reset password for user in another company');
  }

  // HR can only reset EMPLOYEE passwords; ADMIN can reset HR and EMPLOYEE
  if (actorUser.role === ROLES.HR && targetUser.role !== ROLES.EMPLOYEE) {
    throw ApiError.forbidden('HR can only reset passwords for employees');
  }

  targetUser.password = newPassword;
  targetUser.mustChangePassword = true;
  await targetUser.save();

  await logAudit({
    companyId: actorUser.company,
    actorId: actorUser._id,
    action: 'RESET_PASSWORD',
    entityType: 'User',
    entityId: targetUser._id,
    details: {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
    },
    req,
  });

  return { message: 'Password reset successfully. User will be forced to change password on next login.' };
};

export const createHRUser = async (actorUser, email, password, req = null) => {
  if (actorUser.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Only Administrator can create HR accounts');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const hrUser = new User({
    email: normalizedEmail,
    password,
    role: ROLES.HR,
    company: actorUser.company,
    isActive: true,
    mustChangePassword: true,
  });

  await hrUser.save();

  await logAudit({
    companyId: actorUser.company,
    actorId: actorUser._id,
    action: 'CREATE_HR_USER',
    entityType: 'User',
    entityId: hrUser._id,
    details: { email: hrUser.email },
    req,
  });

  return {
    id: hrUser._id,
    email: hrUser.email,
    role: hrUser.role,
    mustChangePassword: hrUser.mustChangePassword,
  };
};

export const toggleUserStatus = async (actorUser, targetUserId, isActive, req = null) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw ApiError.notFound('Target user not found');
  }

  if (targetUser.company.toString() !== actorUser.company.toString()) {
    throw ApiError.forbidden('Cannot manage user in another company');
  }

  if (targetUser.role === ROLES.ADMIN) {
    throw ApiError.forbidden('Cannot deactivate Administrator account');
  }

  if (actorUser.role === ROLES.HR && targetUser.role !== ROLES.EMPLOYEE) {
    throw ApiError.forbidden('HR can only manage employee accounts');
  }

  targetUser.isActive = isActive;
  await targetUser.save();

  // If user is linked to an employee, also update employee.isActive
  if (targetUser.employee) {
    await Employee.findByIdAndUpdate(targetUser.employee, { isActive });
  }

  await logAudit({
    companyId: actorUser.company,
    actorId: actorUser._id,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: targetUser._id,
    details: {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
      isActive,
    },
    req,
  });

  return {
    id: targetUser._id,
    email: targetUser.email,
    isActive: targetUser.isActive,
  };
};

export default {
  login,
  getMe,
  changePassword,
  resetPassword,
  createHRUser,
  toggleUserStatus,
};
