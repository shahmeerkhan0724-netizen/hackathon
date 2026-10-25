import asyncHandler from '../utils/asyncHandler.js';
import notificationService from '../services/notification.service.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotifications(req.user._id, req.query);
  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: result,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user._id, req.params.id);
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});

export default {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
