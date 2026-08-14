import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planKey: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  provider: { type: String, enum: ['stripe', 'razorpay'], required: true },
  providerPaymentId: { type: String, default: null },
  providerOrderId: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending' 
  },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  failureReason: { type: String, default: null },
  refundedAt: { type: Date, default: null },
  refundAmount: { type: Number, default: 0 },
}, { timestamps: true });

paymentSchema.index({ userId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ providerPaymentId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
