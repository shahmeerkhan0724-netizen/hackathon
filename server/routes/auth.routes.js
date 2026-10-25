import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

export default router;
