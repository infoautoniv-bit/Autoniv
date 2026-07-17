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
    },
    widget: {
      enabled: { type: Boolean, default: true },
    },
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
