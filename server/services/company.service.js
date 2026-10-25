import Company from '../models/Company.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';

export const getCompany = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw ApiError.notFound('Company not found');
  }
  return company;
};

export const updateCompanySettings = async (companyId, updateData, actorId, req = null) => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw ApiError.notFound('Company not found');
  }

  const beforeSnapshot = {
    name: company.name,
    legalName: company.legalName,
    settings: { ...company.settings.toObject() },
  };

  if (updateData.name) company.name = updateData.name;
  if (updateData.legalName) company.legalName = updateData.legalName;
  if (updateData.email) company.email = updateData.email;
  if (updateData.phone) company.phone = updateData.phone;
  if (updateData.address) company.address = updateData.address;

  if (updateData.settings) {
    if (updateData.settings.officeStartTime) {
      company.settings.officeStartTime = updateData.settings.officeStartTime;
    }
    if (typeof updateData.settings.gracePeriodMinutes === 'number') {
      company.settings.gracePeriodMinutes = updateData.settings.gracePeriodMinutes;
    }
    if (typeof updateData.settings.halfDayHours === 'number') {
      company.settings.halfDayHours = updateData.settings.halfDayHours;
    }
    if (Array.isArray(updateData.settings.weekendDays)) {
      company.settings.weekendDays = updateData.settings.weekendDays;
    }
    if (updateData.settings.geofence) {
      company.settings.geofence = {
        ...company.settings.geofence,
        ...updateData.settings.geofence,
      };
    }
  }

  await company.save();

  await logAudit({
    companyId,
    actorId,
    action: 'UPDATE_COMPANY_SETTINGS',
    entityType: 'Company',
    entityId: company._id,
    details: {
      before: beforeSnapshot,
      after: {
        name: company.name,
        legalName: company.legalName,
        settings: company.settings,
      },
    },
    req,
  });

  return company;
};

export default {
  getCompany,
  updateCompanySettings,
};
