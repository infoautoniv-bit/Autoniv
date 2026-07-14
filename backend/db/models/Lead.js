import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  callId: { type: mongoose.Schema.Types.ObjectId, ref: 'Call', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: null },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  purpose: { type: String, default: null },
  notes: { type: String, default: null },
  status: { type: String, default: 'new' },
  leadType: { type: String, enum: ['call', 'public', 'chat'], default: 'call' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

leadSchema.index({ userId: 1 });
leadSchema.index({ agentId: 1 });
leadSchema.index({ userId: 1, createdAt: -1 });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
