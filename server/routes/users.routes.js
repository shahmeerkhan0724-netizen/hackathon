import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { createHRUserSchema, resetPasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.use(authenticate);

// Admin creates HR user
router.post(
  '/hr',
  authorize(ROLES.ADMIN),
  validate({ body: createHRUserSchema }),
  authController.createHRUser
);

// Admin or HR resets password for lower accounts
router.patch(
  '/:id/reset-password',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

// Admin or HR activates/deactivates user
router.patch(
  '/:id/toggle-status',
  authorize(ROLES.ADMIN, ROLES.HR),
  authController.toggleUserStatus
);

export default router;
