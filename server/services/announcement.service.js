import Announcement from '../models/Announcement.js';
import Department from '../models/Department.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

export const createAnnouncement = async (companyId, data, actorId, req = null) => {
  if (data.targetDepartments && data.targetDepartments.length > 0) {
    const validDepts = await Department.countDocuments({
      company: companyId,
      _id: { $in: data.targetDepartments },
    });
    if (validDepts !== data.targetDepartments.length) {
      throw ApiError.badRequest('One or more referenced departments do not exist');
    }
  }

  const announcement = new Announcement({
    company: companyId,
    title: data.title.trim(),
    content: data.content.trim(),
    author: actorId,
    targetAudience: data.targetAudience || 'ALL',
    targetDepartments: data.targetDepartments || [],
    isPinned: Boolean(data.isPinned),
    priority: data.priority || 'NORMAL',
  });

  await announcement.save();

  await logAudit({
    companyId,
    actorId,
    action: 'CREATE_ANNOUNCEMENT',
    entityType: 'Announcement',
    entityId: announcement._id,
    details: { title: announcement.title, priority: announcement.priority },
    req,
  });

  return Announcement.findById(announcement._id).populate('author', 'email role');
};

export const getAnnouncements = async (companyId, query = {}) => {
  const { page, limit, skip } = getPaginationParams(query, { defaultSortBy: 'createdAt' });
  const filter = { company: companyId };

  if (query.departmentId) {
    filter.$or = [
      { targetAudience: 'ALL' },
      { targetDepartments: query.departmentId },
    ];
  }

  const [items, totalItems] = await Promise.all([
    Announcement.find(filter)
      .populate('author', 'email role')
      .populate('targetDepartments', 'name code')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Announcement.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export default {
  createAnnouncement,
  getAnnouncements,
};
