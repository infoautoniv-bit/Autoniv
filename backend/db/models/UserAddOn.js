import mongoose from 'mongoose';

const userAddOnSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addOnId: { type: String, required: true },
  notes: { type: String, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
}, { timestamps: true });

userAddOnSchema.index({ userId: 1 });
userAddOnSchema.index({ status: 1 });
userAddOnSchema.index({ userId: 1, addOnId: 1 });

const UserAddOn = mongoose.model('UserAddOn', userAddOnSchema);
export default UserAddOn;
