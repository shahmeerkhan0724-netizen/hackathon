import { Router } from 'express';
import leaveController from '../controllers/leave.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { applyLeaveSchema, leaveDecisionSchema } from '../validators/leave.validator.js';

const router = Router();

router.use(authenticate);

// Employee applies for leave
router.post(
  '/',
  authorize(ROLES.EMPLOYEE),
  validate({ body: applyLeaveSchema }),
  leaveController.applyLeave
);

// Employee view own history and balance
router.get('/me', authorize(ROLES.EMPLOYEE), leaveController.getMyLeaves);
router.get('/balance/me', authorize(ROLES.EMPLOYEE), leaveController.getMyBalances);

// Admin and HR view all company leaves
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), leaveController.getAllLeaves);

// Employee cancels own pending leave
router.patch('/:id/cancel', authorize(ROLES.EMPLOYEE), leaveController.cancelLeave);

// Only HR can decide (approve/reject) leave requests as per Section 9
router.patch(
  '/:id/decision',
  authorize(ROLES.HR),
  validate({ body: leaveDecisionSchema }),
  leaveController.decideLeave
);

export default router;
