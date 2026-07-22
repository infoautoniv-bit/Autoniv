import mongoose from 'mongoose';
import crypto from 'crypto';

const chatbotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  systemPrompt: { type: String, required: true, maxlength: 10000 },
  welcomeMessage: { type: String, default: 'Hi! How can I help you today?' },
  brandColor: { type: String, default: '#0077ff' },
  brandLogo: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  apiKey: { type: String, unique: true, sparse: true },
  conversationCount: { type: Number, default: 0 },
  channels: {
    whatsapp: {
      enabled: { type: Boolean, default: false },
      phoneNumberId: { type: String, default: null },
      wabaId: { type: String, default: null },              // WhatsApp Business Account ID
      businessId: { type: String, default: null },          // Meta Business (portfolio) ID
      accessToken: { type: String, default: null },         // AES-256-CBC encrypted at rest; never returned to client
      displayPhoneNumber: { type: String, default: null },  // e.g. "+1 555 123 4567" for UI display
      verifiedName: { type: String, default: null },        // business display name from Meta
      connectedAt: { type: Date, default: null },           // set when connected via Embedded Signup
    },
    widget: {
      enabled: { type: Boolean, default: true },
    },
    telegram: {
      enabled: { type: Boolean, default: false },
      token: { type: String, default: null },
      botUsername: { type: String, default: null },
    },
    facebook: {
      enabled: { type: Boolean, default: false },
      pageId: { type: String, default: null },
      pageAccessToken: { type: String, default: null },
      instagramAccountId: { type: String, default: null },
    },
  },
  crmIntegrations: {
    hubspotToken: { type: String, default: null },
    webhookUrl: { type: String, default: null },
  },
}, { timestamps: true });

chatbotSchema.index({ userId: 1, createdAt: -1 });

chatbotSchema.pre('save', function (next) {
  if (!this.apiKey) {
    this.apiKey = `cb_${crypto.randomBytes(24).toString('hex')}`;
  }
  next();
});

const Chatbot = mongoose.model('Chatbot', chatbotSchema);
export default Chatbot;
