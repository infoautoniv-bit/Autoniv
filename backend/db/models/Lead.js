import mongoose from 'mongoose';
import { syncLeadToCRM } from '../../services/crmService.js';

const leadSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', default: null },
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

leadSchema.post('save', async function (doc) {
  try {
    if (doc.chatbotId) {
      const Chatbot = mongoose.model('Chatbot');
      const chatbot = await Chatbot.findById(doc.chatbotId);
      if (chatbot) {
        await syncLeadToCRM(chatbot, doc);
      }
    }
  } catch (err) {
    console.error('Lead post-save CRM sync hook failed:', err.message);
  }
});

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
