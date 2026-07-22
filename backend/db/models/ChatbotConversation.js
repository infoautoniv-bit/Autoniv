import mongoose from 'mongoose';

const chatbotMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const chatbotConversationSchema = new mongoose.Schema({
  chatbotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', required: true, index: true },
  channel: { type: String, enum: ['whatsapp', 'widget', 'telegram', 'page', 'instagram'], required: true },
  customerIdentifier: { type: String, required: true },
  messages: [chatbotMessageSchema],
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure unique conversations per chatbot, channel, and customer
chatbotConversationSchema.index({ chatbotId: 1, channel: 1, customerIdentifier: 1 }, { unique: true });
chatbotConversationSchema.index({ chatbotId: 1, lastActive: -1 });

const ChatbotConversation = mongoose.model('ChatbotConversation', chatbotConversationSchema);
export default ChatbotConversation;
