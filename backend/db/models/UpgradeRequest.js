import mongoose from 'mongoose';

const upgradeRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentPlan: { type: String, required: true },
  requestedPlan: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

upgradeRequestSchema.index({ userId: 1 });
upgradeRequestSchema.index({ status: 1 });
upgradeRequestSchema.index({ userId: 1, status: 1 });

const UpgradeRequest = mongoose.model('UpgradeRequest', upgradeRequestSchema);
export default UpgradeRequest;
