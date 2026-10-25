import { Router } from 'express';
import designationController from '../controllers/designation.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { createDesignationSchema, updateDesignationSchema } from '../validators/designation.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', designationController.getDesignations);
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate({ body: createDesignationSchema }),
  designationController.createDesignation
);
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validate({ body: updateDesignationSchema }),
  designationController.updateDesignation
);
router.delete('/:id', authorize(ROLES.ADMIN), designationController.deleteDesignation);

export default router;
