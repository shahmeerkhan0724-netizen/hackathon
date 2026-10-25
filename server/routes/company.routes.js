import { Router } from 'express';
import companyController from '../controllers/company.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { updateCompanySettingsSchema } from '../validators/company.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN, ROLES.HR), companyController.getCompany);
router.put(
  '/settings',
  authorize(ROLES.ADMIN),
  validate({ body: updateCompanySettingsSchema }),
  companyController.updateSettings
);

export default router;
