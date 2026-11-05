import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);

export default router;
