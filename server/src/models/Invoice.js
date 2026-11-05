import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity must be non-negative']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price must be non-negative']
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate must be non-negative']
    },
    lineSubtotal: {
      type: Number,
      default: 0
    },
    lineTax: {
      type: Number,
      default: 0
    },
    lineTotal: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true
    },
    lifecycleState: {
      type: String,
      enum: ['draft', 'issued', 'void'],
      default: 'draft',
      index: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    sellerSnapshot: {
      businessName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      taxId: String,
      logoUrl: String
    },
    customerSnapshot: {
      name: String,
      email: String,
      phone: String,
      billingAddress: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      taxId: String
    },
    items: {
      type: [lineItemSchema],
      default: []
    },
    subtotal: {
      type: Number,
      default: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0
    },
    taxTotal: {
      type: Number,
      default: 0
    },
    additionalCharges: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      default: 0
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    balanceDue: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['draft', 'unpaid', 'partially_paid', 'paid', 'overdue', 'void'],
      default: 'draft',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    terms: {
      type: String,
      trim: true,
      default: ''
    },
    issuedAt: {
      type: Date
    },
    voidedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring invoice numbers are unique per owner
invoiceSchema.index({ ownerId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ ownerId: 1, issueDate: -1 });
invoiceSchema.index({ ownerId: 1, dueDate: 1 });
invoiceSchema.index({ ownerId: 1, lifecycleState: 1 });
invoiceSchema.index({ ownerId: 1, paymentStatus: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
