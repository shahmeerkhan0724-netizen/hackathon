import { Router } from 'express';
import leaveTypeController from '../controllers/leaveType.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { createLeaveTypeSchema, updateLeaveTypeSchema } from '../validators/leaveType.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', leaveTypeController.getLeaveTypes);
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate({ body: createLeaveTypeSchema }),
  leaveTypeController.createLeaveType
);
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validate({ body: updateLeaveTypeSchema }),
  leaveTypeController.updateLeaveType
);
router.delete('/:id', authorize(ROLES.ADMIN), leaveTypeController.deleteLeaveType);

export default router;
