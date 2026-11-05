import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero']
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other'],
      default: 'Bank Transfer',
      required: true
    },
    reference: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['completed', 'reversed'],
      default: 'completed'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ ownerId: 1, invoiceId: 1 });
paymentSchema.index({ ownerId: 1, paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
