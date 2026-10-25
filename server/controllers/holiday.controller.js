import asyncHandler from '../utils/asyncHandler.js';
import holidayService from '../services/holiday.service.js';

export const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.createHoliday(req.companyId, req.body, req.user._id, req);
  res.status(201).json({
    success: true,
    message: 'Public holiday created successfully',
    data: holiday,
  });
});

export const getHolidays = asyncHandler(async (req, res) => {
  const holidays = await holidayService.getHolidays(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Holidays retrieved successfully',
    data: holidays,
  });
});

export const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.updateHoliday(req.companyId, req.params.id, req.body, req.user._id, req);
  res.status(200).json({
    success: true,
    message: 'Holiday updated successfully',
    data: holiday,
  });
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  const result = await holidayService.deleteHoliday(req.companyId, req.params.id, req.user._id, req);
  res.status(200).json({
    success: true,
    message: result.message,
    data: null,
  });
});

export default {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
};
