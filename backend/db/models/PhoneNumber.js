import mongoose from 'mongoose';

const phoneNumberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phoneNumber: { type: String, required: true, trim: true },
  friendlyName: { type: String, trim: true, default: null },
  platform: {
    type: String,
    required: true,
    enum: [
      'twilio',
      'exotel',
      'plivo',
      'ozonetel',
      'mcube',
      'tatatele',
      'maqsam',
      'vobiz',
      'voicelink',
      'vapi',
      'retell',
      'telnyx',
      'signalwire',
      'custom',
    ],
  },
  credentials: { type: mongoose.Schema.Types.Mixed, default: {} },
  assignedToAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['active', 'inactive', 'unassigned'], default: 'active' },
  capabilities: { type: [String], default: ['voice'] },
}, { timestamps: true });

phoneNumberSchema.index({ userId: 1 });
phoneNumberSchema.index({ assignedToAgent: 1 });
phoneNumberSchema.index({ assignedToUser: 1 });

const PhoneNumber = mongoose.model('PhoneNumber', phoneNumberSchema);
export default PhoneNumber;
