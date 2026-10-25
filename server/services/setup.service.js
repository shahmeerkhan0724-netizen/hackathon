import mongoose from 'mongoose';
import Company from '../models/Company.js';
import User from '../models/User.js';
import LeaveType from '../models/LeaveType.js';
import { ROLES, DEFAULT_LEAVE_TYPES, DEFAULT_COMPANY_SETTINGS } from '../config/constants.js';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { logAudit } from '../utils/audit.js';

export const getSetupStatus = async () => {
  const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
  const companyCount = await Company.countDocuments({ isInitialized: true });

  const isInitialized = adminCount > 0 && companyCount > 0;

  return {
    isInitialized,
    hasAdmin: adminCount > 0,
    hasCompany: companyCount > 0,
  };
};

export const initializeSetup = async (setupData = {}, req = null) => {
  // Concurrency and idempotency check
  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
  const existingCompany = await Company.findOne({ isInitialized: true });

  if (existingAdmin || existingCompany) {
    throw ApiError.conflict('System is already initialized. First-run setup cannot be repeated.');
  }

  const companyName = setupData.companyName || 'HCM Lite Enterprise';
  const legalName = setupData.legalName || companyName;
  const adminEmail = (setupData.adminEmail || setupData.email || env.ADMIN_EMAIL || '').toLowerCase().trim();
  const adminPassword = setupData.adminPassword || setupData.password || env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw ApiError.badRequest('Admin email and password are required to initialize setup.');
  }

  if (adminPassword.length < 8) {
    throw ApiError.badRequest('Admin password must be at least 8 characters long.');
  }

  // Create Company
  const company = new Company({
    name: companyName,
    legalName,
    settings: {
      officeStartTime: setupData.officeStartTime || DEFAULT_COMPANY_SETTINGS.officeStartTime,
      gracePeriodMinutes: setupData.gracePeriodMinutes ?? DEFAULT_COMPANY_SETTINGS.gracePeriodMinutes,
      halfDayHours: setupData.halfDayHours ?? DEFAULT_COMPANY_SETTINGS.halfDayHours,
      weekendDays: setupData.weekendDays || DEFAULT_COMPANY_SETTINGS.weekendDays,
    },
    isInitialized: true,
  });

  await company.save();

  // Create Admin User
  const admin = new User({
    email: adminEmail,
    password: adminPassword,
    role: ROLES.ADMIN,
    company: company._id,
    isActive: true,
    mustChangePassword: false,
  });

  await admin.save();

  // Seed default leave types for the company
  const leaveTypeDocs = DEFAULT_LEAVE_TYPES.map((lt) => ({
    company: company._id,
    name: lt.name,
    code: lt.code,
    daysPerYear: lt.daysPerYear,
    isPaid: lt.isPaid,
    isUnlimited: lt.isUnlimited,
    description: lt.description,
    isActive: true,
  }));

  await LeaveType.insertMany(leaveTypeDocs);

  // Generate auth token for the initial admin
  const token = generateToken({
    id: admin._id,
    role: admin.role,
    companyId: company._id,
    employeeId: null,
  });

  // Audit Setup Initialization
  await logAudit({
    companyId: company._id,
    actorId: admin._id,
    action: 'SYSTEM_INITIALIZATION',
    entityType: 'Company',
    entityId: company._id,
    details: {
      companyName: company.name,
      adminEmail: admin.email,
    },
    req,
  });

  return {
    company: {
      id: company._id,
      name: company.name,
      settings: company.settings,
    },
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    token,
  };
};

export default {
  getSetupStatus,
  initializeSetup,
};
