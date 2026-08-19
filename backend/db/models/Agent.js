import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vapiId: { type: String, default: null },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, required: true, enum: ['receptionist', 'appointment', 'faq'] },
  prompt: { type: String, default: null, maxlength: 10000 },
  voiceId: { type: String, default: null },
  voiceProvider: { type: String, default: 'deepgram', enum: ['deepgram', 'elevenlabs', 'sarvam', 'cartesia', 'openai', 'smallest', 'custom'] },
  voiceSpeed: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
  customTtsBaseUrl: { type: String, default: null },
  firstMessage: { type: String, default: null, maxlength: 1000 },
  phoneNumberId: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  language: { type: String, default: null, maxlength: 50 },
  isActive: { type: Boolean, default: true },
  callCount: { type: Number, default: 0 },
  useCustomEngine: { type: Boolean, default: false },
  customEngineModel: { type: String, default: 'groq:qwen/qwen3.6-27b' },
  dialogueMode: { type: String, default: 'graph', enum: ['linear', 'graph'] },
  telephonyProvider: { type: String, default: 'twilio', enum: ['twilio', 'telnyx', 'plivo', 'asterisk', 'exotel', 'custom'] },
  mcpServerUrl: { type: String, default: null },
  mcpApiKey: { type: String, default: null },
  maxConcurrentCalls: { type: Number, default: 1, min: 0 },
  twilioAccountSid: { type: String, default: null },
  twilioAuthToken: { type: String, default: null },
  crmIntegrations: {
    hubspotToken: { type: String, default: null },
    webhookUrl: { type: String, default: null },
    webhookSecret: { type: String, default: null },
    mcpServerUrl: { type: String, default: null },
    mcpApiKey: { type: String, default: null },
    fieldMapping: { type: mongoose.Schema.Types.Mixed, default: null },
    customHeaders: { type: mongoose.Schema.Types.Mixed, default: null },
    payloadTemplate: { type: String, default: null },
    googleSheetId: { type: String, default: null },
    googleSheetUrl: { type: String, default: null },
  },
  webhookUrl: { type: String, default: null },
  googleSheetId: { type: String, default: null },
  googleSheetUrl: { type: String, default: null },
}, { timestamps: true });

agentSchema.index({ userId: 1 });
agentSchema.index({ userId: 1, createdAt: -1 });
agentSchema.index({ vapiId: 1 });

const Agent = mongoose.model('Agent', agentSchema);
export default Agent;
