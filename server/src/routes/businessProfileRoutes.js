import express from 'express';
import {
  getBusinessProfile,
  createOrUpdateBusinessProfile
} from '../controllers/businessProfileController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { businessProfileSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBusinessProfile);
router.post('/', validateRequest(businessProfileSchema), createOrUpdateBusinessProfile);
router.put('/', validateRequest(businessProfileSchema), createOrUpdateBusinessProfile);

export default router;
