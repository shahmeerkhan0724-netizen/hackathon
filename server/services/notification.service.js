import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

export const getMyNotifications = async (userId, query = {}) => {
  const { page, limit, skip } = getPaginationParams(query, { defaultSortBy: 'createdAt' });
  const filter = { user: userId };

  if (typeof query.isRead !== 'undefined') {
    filter.isRead = query.isRead === 'true' || query.isRead === true;
  }

  const [items, totalItems] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { message: 'All notifications marked as read', modifiedCount: result.modifiedCount };
};

export default {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
