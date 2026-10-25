import { Router } from 'express';
import attendanceController from '../controllers/attendance.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import {
  checkInSchema,
  checkOutSchema,
  correctionRequestSchema,
  correctionDecisionSchema,
} from '../validators/attendance.validator.js';

const router = Router();

router.use(authenticate);

// Employee check in / check out
router.post(
  '/check-in',
  authorize(ROLES.EMPLOYEE),
  validate({ body: checkInSchema }),
  attendanceController.checkIn
);
router.post(
  '/check-out',
  authorize(ROLES.EMPLOYEE),
  validate({ body: checkOutSchema }),
  attendanceController.checkOut
);

// Employee own attendance history
router.get('/me', authorize(ROLES.EMPLOYEE), attendanceController.getMyAttendance);

// HR and Admin daily attendance board
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), attendanceController.getDailyBoard);

// Attendance corrections
router.post(
  '/corrections',
  authorize(ROLES.EMPLOYEE),
  validate({ body: correctionRequestSchema }),
  attendanceController.requestCorrection
);
router.get('/corrections', attendanceController.getCorrections);

// Only HR can decide attendance corrections as per Section 8
router.patch(
  '/corrections/:id/decision',
  authorize(ROLES.HR),
  validate({ body: correctionDecisionSchema }),
  attendanceController.decideCorrection
);

export default router;
