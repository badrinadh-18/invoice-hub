import express from 'express';
import {
  getDashboardSummary,
  getMonthlyStats,
  getInvoiceStatusDistribution
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/monthly-stats', getMonthlyStats);
router.get('/invoice-status', getInvoiceStatusDistribution);

export default router;
