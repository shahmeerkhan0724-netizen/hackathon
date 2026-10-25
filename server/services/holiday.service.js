import Holiday from '../models/Holiday.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';

export const createHoliday = async (companyId, data, actorId, req = null) => {
  const existing = await Holiday.findOne({ company: companyId, date: data.date });
  if (existing) {
    throw ApiError.conflict(`A holiday already exists for date ${data.date} ("${existing.title}")`);
  }

  const holiday = new Holiday({
    company: companyId,
    title: data.title.trim(),
    date: data.date,
    description: data.description ? data.description.trim() : '',
    isRecurring: Boolean(data.isRecurring),
  });

  await holiday.save();

  await logAudit({
    companyId,
    actorId,
    action: 'CREATE_HOLIDAY',
    entityType: 'Holiday',
    entityId: holiday._id,
    details: { title: holiday.title, date: holiday.date },
    req,
  });

  return holiday;
};

export const getHolidays = async (companyId, query = {}) => {
  const filter = { company: companyId };
  if (query.year) {
    const yearStr = String(query.year);
    filter.date = { $regex: new RegExp(`^${yearStr}`) };
  }
  return Holiday.find(filter).sort({ date: 1 });
};

export const updateHoliday = async (companyId, holidayId, data, actorId, req = null) => {
  const holiday = await Holiday.findOne({ _id: holidayId, company: companyId });
  if (!holiday) {
    throw ApiError.notFound('Holiday not found');
  }

  if (data.date && data.date !== holiday.date) {
    const existing = await Holiday.findOne({ company: companyId, date: data.date, _id: { $ne: holidayId } });
    if (existing) {
      throw ApiError.conflict(`A holiday already exists for date ${data.date}`);
    }
    holiday.date = data.date;
  }

  if (data.title) holiday.title = data.title.trim();
  if (data.description !== undefined) holiday.description = data.description.trim();
  if (data.isRecurring !== undefined) holiday.isRecurring = data.isRecurring;

  await holiday.save();

  await logAudit({
    companyId,
    actorId,
    action: 'UPDATE_HOLIDAY',
    entityType: 'Holiday',
    entityId: holiday._id,
    details: { title: holiday.title, date: holiday.date },
    req,
  });

  return holiday;
};

export const deleteHoliday = async (companyId, holidayId, actorId, req = null) => {
  const holiday = await Holiday.findOne({ _id: holidayId, company: companyId });
  if (!holiday) {
    throw ApiError.notFound('Holiday not found');
  }

  await Holiday.findByIdAndDelete(holidayId);

  await logAudit({
    companyId,
    actorId,
    action: 'DELETE_HOLIDAY',
    entityType: 'Holiday',
    entityId: holidayId,
    details: { title: holiday.title, date: holiday.date },
    req,
  });

  return { message: `Holiday "${holiday.title}" deleted successfully` };
};

export default {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
};
