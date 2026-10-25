import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize(ROLES.ADMIN), dashboardController.getAdminDashboard);
router.get('/hr', authorize(ROLES.HR), dashboardController.getHRDashboard);
router.get('/me', authorize(ROLES.EMPLOYEE), dashboardController.getEmployeeDashboard);

export default router;
