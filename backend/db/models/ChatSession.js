import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role:     { type: String, enum: ['user', 'bot'], required: true },
  text:     { type: String, required: true },
  timestamp:{ type: Date, default: Date.now },
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, default: 'New Chat' },
  messages:  [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

chatSessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);
