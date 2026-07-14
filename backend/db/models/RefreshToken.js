import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
    expires: 0,
  },
  createdAtIp: { type: String, default: null, maxlength: 64 },
  userAgent: { type: String, default: null, maxlength: 500 },
  revokedAt: { type: Date, default: null },
  revokedReason: { type: String, default: null, maxlength: 64 },
  replacedByHash: { type: String, default: null },
}, { timestamps: true });

refreshTokenSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
