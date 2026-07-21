import mongoose from 'mongoose';

const campaignNumberSchema = new mongoose.Schema({
  phone:       { type: String, required: true },
  name:        { type: String, default: null },
  status:      { type: String, enum: ['pending', 'calling', 'completed', 'failed', 'no-answer', 'busy', 'skipped'], default: 'pending' },
  callId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Call', default: null },
  error:       { type: String, default: null },
  startedAt:   { type: Date, default: null },
  endedAt:     { type: Date, default: null },
}, { _id: true });

const bulkCampaignSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  name:         { type: String, required: true, trim: true, maxlength: 200 },
  status:       { type: String, enum: ['draft', 'running', 'paused', 'completed', 'cancelled'], default: 'draft' },
  numbers:      { type: [campaignNumberSchema], default: [] },
  twilioPhoneNumber: { type: String, default: null },
  twilioAccountSid:   { type: String, default: null },
  twilioAuthToken:    { type: String, default: null },
  concurrency:  { type: Number, default: 1, min: 1, max: 5 },
  delayMs:      { type: Number, default: 2000, min: 0 },
  startedAt:    { type: Date, default: null },
  completedAt:  { type: Date, default: null },
  totalCount:   { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  failedCount:  { type: Number, default: 0 },
}, { timestamps: true });

bulkCampaignSchema.index({ userId: 1, createdAt: -1 });
bulkCampaignSchema.index({ userId: 1, status: 1 });

const BulkCampaign = mongoose.model('BulkCampaign', bulkCampaignSchema);
export default BulkCampaign;
