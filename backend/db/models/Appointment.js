import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { syncAppointmentToCRM } from '../../services/crmService.js';

export function generateReferenceNo() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `APT-${dateStr}-${rand}`;
}

const appointmentSchema = new mongoose.Schema({
  referenceNo: { type: String, unique: true, index: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  callId: { type: mongoose.Schema.Types.ObjectId, ref: 'Call', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: null },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  service: { type: String, default: null },
  provider: { type: String, default: null },
  patientType: { type: String, default: null },
  preferredDate: { type: String, default: null },
  preferredTime: { type: String, default: null },
  status: { type: String, default: 'pending' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

appointmentSchema.pre('save', function (next) {
  if (!this.referenceNo) {
    this.referenceNo = generateReferenceNo();
  }
  next();
});

appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ agentId: 1 });
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ createdAt: -1 });

appointmentSchema.post('save', async function (doc) {
  try {
    if (doc.agentId) {
      const Agent = mongoose.model('Agent');
      const agent = await Agent.findById(doc.agentId);
      if (agent) {
        await syncAppointmentToCRM(agent, doc);
      }
    }
    if (doc.userId) {
      const User = mongoose.model('User');
      const user = await User.findById(doc.userId);
      if (user && user.crmIntegrations) {
        await syncAppointmentToCRM(user, doc);
      }
    }
  } catch (err) {
    console.error('Appointment post-save CRM sync hook failed:', err.message);
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
