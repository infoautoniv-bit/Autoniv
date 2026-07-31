import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  event: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  severity: { type: String, enum: ['info', 'warn', 'error', 'critical'], default: 'info' },
}, {
  timestamps: true,
  capped: { size: 100 * 1024 * 1024, max: 1000000 }, // 100MB cap, max 1M documents
});

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day TTL

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

export async function auditLog(event, { userId, ip, userAgent, details, severity = 'info' } = {}) {
  try {
    await AuditLog.create({ event, userId, ip, userAgent, details, severity });
  } catch (err) {
    // Audit log write failure should never break the application
    console.error('audit_log_write_failed', { event, error: err.message });
  }
}
