import mongoose from 'mongoose';
import crypto from 'crypto';

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const PasswordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '0' }, // TTL index, auto-remove after expiry
  },
  used: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export const PasswordReset = mongoose.model('PasswordReset', PasswordResetSchema);
