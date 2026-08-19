import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  agentId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  orchestratorCallId: { type: String, default: undefined },
  vapiCallId:         { type: String, default: undefined }, // legacy backward compatibility
  callerNumber:       { type: String, default: null },
  fromNumber:         { type: String, default: null },
  duration:           { type: Number, default: 0 },
  status:             {
    type: String,
    enum: ['queued', 'initiating', 'in-progress', 'completed', 'missed', 'failed'],
    default: 'initiating',
  },
  recordingUrl:       { type: String, default: null },
  transcript:         { type: String, default: null },
  metadata:           { type: mongoose.Schema.Types.Mixed, default: {} },
  startedAt:          { type: Date, default: null },
  endedAt:            { type: Date, default: null },
  endedReason:        { type: String, default: null },
  billed:             { type: Boolean, default: false },
}, { timestamps: true });

callSchema.index({ userId: 1 });
callSchema.index({ agentId: 1 });
callSchema.index({ orchestratorCallId: 1 }, { sparse: true });
callSchema.index({ orchestratorCallId: 1, status: 1 });
callSchema.index({ vapiCallId: 1 }, { unique: true, sparse: true });
callSchema.index({ vapiCallId: 1, billed: 1 });
callSchema.index({ startedAt: -1 });
callSchema.index({ userId: 1, startedAt: -1 });
callSchema.index({ userId: 1, status: 1, startedAt: -1 });
callSchema.index({ status: 1, startedAt: -1 });

// Increment agent's callCount when a new call is created
callSchema.pre('save', async function (next) {
  if (this.isNew && this.agentId) {
    try {
      await mongoose.model('Agent').updateOne(
        { _id: this.agentId },
        { $inc: { callCount: 1 } }
      );
    } catch {
      // Non-critical — don't block call creation
    }
  }
  next();
});

const Call = mongoose.model('Call', callSchema);
export default Call;