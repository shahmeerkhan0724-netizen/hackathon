import { Router } from 'express';
import aiController from '../controllers/ai.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimiters.js';
import { ROLES } from '../config/constants.js';
import { aiChatSchema, aiSummarySchema, smartLeaveSchema } from '../validators/ai.validator.js';

const router = Router();

router.use(authenticate);

// Chat endpoint (20 req/hour/user rate limited)
router.post('/chat', aiLimiter, validate({ body: aiChatSchema }), aiController.chat);

// AI Dashboard Summary (Admin & HR only)
router.post(
  '/summary',
  authorize(ROLES.ADMIN, ROLES.HR),
  aiLimiter,
  validate({ body: aiSummarySchema }),
  aiController.summarize
);

// Smart Leave form assistant (All roles)
router.post('/smart-leave', aiLimiter, validate({ body: smartLeaveSchema }), aiController.smartLeave);

export default router;
