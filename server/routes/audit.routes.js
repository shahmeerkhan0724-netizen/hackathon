import { Router } from 'express';
import auditController from '../controllers/audit.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// Only Admin can view audit logs (Section 13)
router.get('/', authorize(ROLES.ADMIN), auditController.getAuditLogs);

export default router;
