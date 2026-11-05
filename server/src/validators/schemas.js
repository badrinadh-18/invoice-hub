import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password')
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const userProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional()
  })
});

export const customerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Customer name is required').max(120),
    email: z.string().email('Invalid email address').or(z.literal('')).optional(),
    phone: z.string().max(30).optional().default(''),
    billingAddress: z.string().max(255).optional().default(''),
    city: z.string().max(100).optional().default(''),
    state: z.string().max(100).optional().default(''),
    postalCode: z.string().max(30).optional().default(''),
    country: z.string().max(100).optional().default(''),
    taxId: z.string().max(60).optional().default(''),
    notes: z.string().max(500).optional().default('')
  })
});

export const businessProfileSchema = z.object({
  body: z.object({
    businessName: z.string().min(1, 'Business name is required').max(150),
    email: z.string().email('Invalid email address').or(z.literal('')).optional(),
    phone: z.string().max(30).optional().default(''),
    address: z.string().max(255).optional().default(''),
    city: z.string().max(100).optional().default(''),
    state: z.string().max(100).optional().default(''),
    postalCode: z.string().max(30).optional().default(''),
    country: z.string().max(100).optional().default(''),
    taxId: z.string().max(60).optional().default(''),
    logoUrl: z.string().url().or(z.literal('')).optional().default(''),
    defaultCurrency: z.string().min(1).max(5).default('INR'),
    defaultPaymentTerms: z.string().max(50).default('Net 15'),
    invoiceNotes: z.string().max(500).default('')
  })
});

const lineItemInput = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than zero'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  taxRate: z.coerce.number().min(0, 'Tax rate must be non-negative').max(100).default(0)
});

export const invoiceCreateSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    dueDate: z.string().or(z.date()).optional(),
    currency: z.string().min(1).max(5).default('INR'),
    items: z.array(lineItemInput).default([]),
    discountType: z.enum(['percentage', 'fixed']).default('percentage'),
    discountValue: z.coerce.number().min(0).default(0),
    taxRate: z.coerce.number().min(0).max(100).default(0),
    additionalCharges: z.coerce.number().min(0).default(0),
    notes: z.string().max(1000).optional().default(''),
    terms: z.string().max(1000).optional().default(''),
    issueImmediately: z.boolean().optional().default(false)
  })
});

export const invoiceUpdateSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    dueDate: z.string().or(z.date()).optional(),
    currency: z.string().min(1).max(5).optional(),
    items: z.array(lineItemInput).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.coerce.number().min(0).optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    additionalCharges: z.coerce.number().min(0).optional(),
    notes: z.string().max(1000).optional(),
    terms: z.string().max(1000).optional()
  })
});

export const paymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().min(0.01, 'Payment amount must be greater than 0'),
    paymentDate: z.string().or(z.date()).optional(),
    method: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other']).default('Bank Transfer'),
    reference: z.string().max(100).optional().default(''),
    notes: z.string().max(500).optional().default('')
  })
});

export const userStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'inactive', 'suspended']),
    reason: z.string().max(255).optional().default('')
  })
});
