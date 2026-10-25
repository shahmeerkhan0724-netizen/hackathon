import { Router } from 'express';
import setupController from '../controllers/setup.controller.js';
import validate from '../middleware/validate.js';
import { initializeSetupSchema } from '../validators/setup.validator.js';

const router = Router();

router.get('/status', setupController.getStatus);
router.get('/', setupController.getStatus);
router.post('/initialize', validate({ body: initializeSetupSchema }), setupController.initialize);

export default router;
