import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  validateResetToken,
  resetPassword
} from '../controllers/authController.js';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many password reset attempts. Please try later.' } }
});
import { validateRequest } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password/:token', resetPassword);

export default router;
