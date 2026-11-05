import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    billingAddress: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    postalCode: {
      type: String,
      trim: true,
      default: ''
    },
    country: {
      type: String,
      trim: true,
      default: ''
    },
    taxId: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({ ownerId: 1, name: 1 });
customerSchema.index({ ownerId: 1, email: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
