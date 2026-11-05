import mongoose from 'mongoose';

const businessProfileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: 150
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
    address: {
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
    logoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    defaultCurrency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    defaultPaymentTerms: {
      type: String,
      default: 'Net 15',
      trim: true
    },
    invoiceNotes: {
      type: String,
      trim: true,
      default: 'Thank you for your business!'
    }
  },
  {
    timestamps: true
  }
);

export const BusinessProfile = mongoose.model('BusinessProfile', businessProfileSchema);
