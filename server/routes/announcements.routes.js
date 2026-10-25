import { Router } from 'express';
import announcementController from '../controllers/announcement.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { createAnnouncementSchema } from '../validators/announcement.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', announcementController.getAnnouncements);
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.HR),
  validate({ body: createAnnouncementSchema }),
  announcementController.createAnnouncement
);

export default router;
