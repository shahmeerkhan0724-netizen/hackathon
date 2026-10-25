import { Router } from 'express';
import holidayController from '../controllers/holiday.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { createHolidaySchema, updateHolidaySchema } from '../validators/holiday.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', holidayController.getHolidays);
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate({ body: createHolidaySchema }),
  holidayController.createHoliday
);
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validate({ body: updateHolidaySchema }),
  holidayController.updateHoliday
);
router.delete('/:id', authorize(ROLES.ADMIN), holidayController.deleteHoliday);

export default router;
