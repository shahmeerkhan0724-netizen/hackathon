import asyncHandler from '../utils/asyncHandler.js';
import auditService from '../services/audit.service.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditService.getAuditLogs(req.companyId, req.query);
  res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data: result,
  });
});

export default {
  getAuditLogs,
};
