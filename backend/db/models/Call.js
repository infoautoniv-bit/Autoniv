import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  agentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vapiCallId:   { type: String, default: null },
  callerNumber: { type: String, default: null },
  duration:     { type: Number, default: 0 },
  status:       {
    type: String,
    enum: ['completed', 'missed', 'failed', 'in-progress'],
    default: 'completed',
  },
  recordingUrl: { type: String, default: null },
  transcript:   { type: String, default: null },
  startedAt:    { type: Date, default: null },
  endedAt:      { type: Date, default: null },
  endedReason:  { type: String, default: null },
  billed:       { type: Boolean, default: false },
}, { timestamps: true });

callSchema.index({ userId: 1 });
callSchema.index({ agentId: 1 });
callSchema.index({ vapiCallId: 1 }, { unique: true, sparse: true });
callSchema.index({ startedAt: -1 });
callSchema.index({ userId: 1, startedAt: -1 });
callSchema.index({ status: 1, startedAt: -1 });

const Call = mongoose.model('Call', callSchema);
export default Call;