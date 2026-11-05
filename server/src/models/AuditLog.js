import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    actorEmail: {
      type: String,
      default: 'system'
    },
    actorRole: {
      type: String,
      default: 'system'
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      required: true,
      index: true
    },
    targetId: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
