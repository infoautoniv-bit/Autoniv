import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: null },
  company: { type: String, default: null },
  message: { type: String, required: true },
  status: { type: String, default: 'new' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
