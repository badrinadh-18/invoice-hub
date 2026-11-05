import { AuditLog } from '../models/AuditLog.js';

export const logAuditEvent = async ({
  actorId = null,
  actorEmail = 'system',
  actorRole = 'system',
  action,
  targetType,
  targetId = '',
  reason = '',
  ip = '',
  metadata = {}
}) => {
  try {
    // Sanitize metadata to never include password or token fields
    const safeMetadata = { ...metadata };
    delete safeMetadata.password;
    delete safeMetadata.passwordHash;
    delete safeMetadata.confirmPassword;
    delete safeMetadata.token;
    delete safeMetadata.jwt;

    await AuditLog.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      targetType,
      targetId: String(targetId || ''),
      reason,
      ip,
      metadata: safeMetadata,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[AuditLog Error] Failed to log audit event:', err.message);
  }
};
