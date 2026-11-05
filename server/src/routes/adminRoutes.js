import express from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validateRequest } from '../middleware/validate.js';
import { userStatusSchema } from '../validators/schemas.js';

const router = express.Router();

// Strict Admin protection: Both authentication and admin role required
router.use(authenticate, requireRole('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/status', validateRequest(userStatusSchema), updateUserStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
