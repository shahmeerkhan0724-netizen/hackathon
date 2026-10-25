import AuditLog from '../models/AuditLog.js';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

export const getAuditLogs = async (companyId, query = {}) => {
  const { page, limit, skip, sort } = getPaginationParams(query, { defaultSortBy: 'timestamp' });
  const filter = { company: companyId };

  if (query.action) {
    filter.action = query.action;
  }

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.actorId) {
    filter.actor = query.actorId;
  }

  if (query.startDate && query.endDate) {
    filter.timestamp = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  const [items, totalItems] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, totalItems, page, limit);
};

export default {
  getAuditLogs,
};
