import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  issueInvoice,
  voidInvoice,
  downloadInvoicePDF
} from '../controllers/invoiceController.js';
import {
  getInvoicePayments,
  recordPayment
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  invoiceCreateSchema,
  invoiceUpdateSchema,
  paymentSchema
} from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getInvoices);
router.post('/', validateRequest(invoiceCreateSchema), createInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id', validateRequest(invoiceUpdateSchema), updateInvoice);
router.delete('/:id', deleteInvoice);

router.post('/:id/issue', issueInvoice);
router.post('/:id/void', voidInvoice);
router.get('/:id/pdf', downloadInvoicePDF);

// Payment endpoints
router.get('/:id/payments', getInvoicePayments);
router.post('/:id/payments', validateRequest(paymentSchema), recordPayment);

export default router;
