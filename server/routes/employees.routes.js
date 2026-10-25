import { Router } from 'express';
import express from 'express';
import employeeController from '../controllers/employee.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateSelfProfileSchema,
} from '../validators/employee.validator.js';

const router = Router();

router.use(authenticate);

// Directory - Admin and HR can view
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), employeeController.getEmployees);

// Self profile for Employee
router.get('/me', authorize(ROLES.EMPLOYEE), employeeController.getMyProfile);
router.patch(
  '/me',
  authorize(ROLES.EMPLOYEE),
  validate({ body: updateSelfProfileSchema }),
  employeeController.updateSelfProfile
);

// CSV Export - Admin and HR
router.get('/export', authorize(ROLES.ADMIN, ROLES.HR), employeeController.exportEmployees);

// CSV Import - HR only (supports text/csv or JSON with csvData)
router.post(
  '/import',
  authorize(ROLES.HR),
  express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }),
  employeeController.importEmployees
);

// Create employee - HR only
router.post(
  '/',
  authorize(ROLES.HR),
  validate({ body: createEmployeeSchema }),
  employeeController.createEmployee
);

// View employee 360 profile (Admin, HR, or self)
router.get('/:id', employeeController.getEmployeeById);

// Update employee - HR and Admin
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate({ body: updateEmployeeSchema }),
  employeeController.updateEmployee
);

export default router;
