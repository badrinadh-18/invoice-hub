import express from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { userProfileUpdateSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', validateRequest(userProfileUpdateSchema), updateProfile);
router.delete('/me', deleteAccount);

export default router;
