import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
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

appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ agentId: 1 });
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ createdAt: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
