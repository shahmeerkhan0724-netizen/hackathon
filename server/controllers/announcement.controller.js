import asyncHandler from '../utils/asyncHandler.js';
import announcementService from '../services/announcement.service.js';

export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(req.companyId, req.body, req.user._id, req);
  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    data: announcement,
  });
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const result = await announcementService.getAnnouncements(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Announcements retrieved successfully',
    data: result,
  });
});

export default {
  createAnnouncement,
  getAnnouncements,
};
