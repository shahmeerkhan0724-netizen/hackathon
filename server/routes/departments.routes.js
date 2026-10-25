import { Router } from 'express';
import departmentController from '../controllers/department.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate({ body: createDepartmentSchema }),
  departmentController.createDepartment
);
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validate({ body: updateDepartmentSchema }),
  departmentController.updateDepartment
);
router.delete('/:id', authorize(ROLES.ADMIN), departmentController.deleteDepartment);

export default router;
