import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'new' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

supportSchema.index({ createdAt: -1 });
supportSchema.index({ status: 1 });

const Support = mongoose.model('Support', supportSchema);
export default Support;
