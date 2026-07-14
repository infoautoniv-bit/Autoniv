import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  type: { type: String, required: true },
  payload: { type: String, default: null },
  processed: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

webhookSchema.index({ type: 1, createdAt: -1 });

const Webhook = mongoose.model('Webhook', webhookSchema);
export default Webhook;
