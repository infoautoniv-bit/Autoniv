import mongoose from 'mongoose';
import Call from '../../db/models/Call.js';
import Lead from '../../db/models/Lead.js';
import User from '../../db/models/User.js';
import { uploadRecording } from '../cloudinary.js';
import { log } from '../logger.js';

export async function closeAndCleanup({ callSid, agentObj, callStartTime, fullTranscript, deepgramWs, pendingLeadData, recorder }) {
  if (deepgramWs) {
    try {
      deepgramWs.close();
    } catch (err) {
      log.error('cleanup_deepgram_close_error', { error: err.message });
    }
  }

  try {
    if (callSid) {
      const durationSeconds = Math.round((new Date().getTime() - callStartTime.getTime()) / 1000);

      let recordingUrl = null;
      if (recorder) {
        try {
          const wavBuffer = recorder.getWavBuffer();
          log.info('audio_recording_wav_buffer', { size: wavBuffer.length, maxByteOffset: recorder.maxByteOffset });
          if (recorder.maxByteOffset > 0) {
            const filename = `${callSid}.wav`;
            recordingUrl = await uploadRecording(wavBuffer, filename);
            log.info('audio_recording_uploaded', { url: recordingUrl });
          } else {
            log.info('audio_recording_no_data');
          }
        } catch (recErr) {
          log.error('audio_recording_upload_failed', { error: recErr.message, stack: recErr.stack });
        }
      } else {
        log.info('audio_recording_no_recorder');
      }

      const updateData = {
        status: 'completed',
        duration: durationSeconds,
        endedAt: new Date(),
        transcript: fullTranscript.trim() || 'No transcript generated',
      };
      if (recordingUrl) {
        updateData.recordingUrl = recordingUrl;
      }

      await Call.findOneAndUpdate({ vapiCallId: callSid }, updateData);

      if (agentObj && durationSeconds > 0) {
        const billingMinutes = Math.ceil(durationSeconds / 60);
        const flip = await Call.findOneAndUpdate(
          { vapiCallId: callSid, billed: { $ne: true } },
          { $set: { billed: true } }
        );
        if (flip) {
          await User.findByIdAndUpdate(agentObj.userId, {
            $inc: { minutesUsed: billingMinutes, callsUsed: 1 }
          });
          log.info('billing_added', { minutes: billingMinutes, userId: agentObj.userId });
        } else {
          log.info('billing_skipped', { callSid });
        }
      }
    }

    if (pendingLeadData && (pendingLeadData.name || pendingLeadData.phone)) {
      let mongoCallId = null;
      if (pendingLeadData.callId) {
        if (mongoose.Types.ObjectId.isValid(pendingLeadData.callId)) {
          mongoCallId = pendingLeadData.callId;
        } else {
          const callDoc = await Call.findOne({ vapiCallId: pendingLeadData.callId }).select('_id').lean();
          if (callDoc) mongoCallId = callDoc._id;
        }
      }
      pendingLeadData.callId = mongoCallId;

      const existingLead = await Lead.findOne({
        agentId: pendingLeadData.agentId,
        $or: [
          ...(mongoCallId ? [{ callId: mongoCallId }] : []),
          ...(pendingLeadData.phone ? [{ phone: pendingLeadData.phone }] : [])
        ]
      }).lean();

      if (!existingLead) {
        const lead = await Lead.create(pendingLeadData);
        log.info('lead_saved', { leadId: lead._id, agentId: pendingLeadData.agentId });
      }
    }
  } catch (dbErr) {
    log.error('close_cleanup_error', { error: dbErr.message });
  }
}
