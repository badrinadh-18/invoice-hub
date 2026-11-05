import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { customerSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCustomers);
router.post('/', validateRequest(customerSchema), createCustomer);
router.get('/:id', getCustomerById);
router.put('/:id', validateRequest(customerSchema), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
