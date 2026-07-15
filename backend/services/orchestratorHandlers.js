/**
 * Voice Orchestrator Event Handlers
 * Saves leads, appointments, and call data from custom voice agent
 */

import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import User from '../db/models/User.js';
import { log } from '../services/logger.js';
import { parsePhoneWordsToDigits } from './validators.js';

// Handle tool calls from voice agent (saveLead, saveAppointment)
process.on('voiceAgentToolCall', async ({ callSid, toolName, args }) => {
  try {
    const call = await Call.findOne({ vapiCallId: callSid }).populate('agentId');
    if (!call) {
      log.warn('orchestrator_tool_call_no_call', { callSid });
      return;
    }

    if (toolName === 'saveLead') {
      const cleanPhone = parsePhoneWordsToDigits(args.phone);
      const digits = cleanPhone ? cleanPhone.replace(/\D/g, '') : '';
      if (digits.slice(-10).length !== 10) {
        log.warn('orchestrator_save_lead_ignored_invalid_phone', { phone: args.phone, callSid });
        return;
      }

      const lead = await Lead.create({
        agentId: call.agentId,
        callId: call._id,
        userId: call.userId,
        name: args.name,
        phone: cleanPhone,
        email: args.email || null,
        purpose: (args.purpose && !['unknown', 'Unknown'].includes(args.purpose)) ? args.purpose : 'General inquiry',
      });
      log.info('orchestrator_lead_saved', { leadId: lead._id, callSid });
    }

    if (toolName === 'saveAppointment') {
      const cleanPhone = parsePhoneWordsToDigits(args.phone);
      const digits = cleanPhone ? cleanPhone.replace(/\D/g, '') : '';
      if (digits.slice(-10).length !== 10) {
        log.warn('orchestrator_save_appointment_ignored_invalid_phone', { phone: args.phone, callSid });
        return;
      }

      const appointment = await Appointment.create({
        agentId: call.agentId,
        callId: call._id,
        userId: call.userId,
        customerName: args.name,
        customerPhone: cleanPhone,
        service: args.service,
        preferredDate: args.preferredDate || null,
        preferredTime: args.preferredTime || null,
        status: 'pending',
      });
      log.info('orchestrator_appointment_saved', { appointmentId: appointment._id, callSid });
    }
  } catch (err) {
    log.error('orchestrator_tool_call_error', { error: err.message, callSid });
  }
});

// Handle call end event from orchestrator
process.on('voiceCallEnded', async ({ callSid, transcript, leadData }) => {
  try {
    const transcriptText = transcript
      .map(t => `${t.role}: ${t.text}`)
      .join('\n');

    const duration = transcript.length > 0
      ? Math.floor((transcript[transcript.length - 1].timestamp - transcript[0].timestamp) / 1000)
      : 0;

    await Call.updateOne(
      { vapiCallId: callSid },
      {
        status: 'completed',
        transcript: transcriptText,
        duration,
        endedAt: new Date(),
      }
    );

    // Update user minutes
    if (duration > 0) {
      const call = await Call.findOne({ vapiCallId: callSid });
      if (call) {
        const minutes = Math.ceil(duration / 60);
        await User.findByIdAndUpdate(call.userId, {
          $inc: { minutesUsed: minutes, callsUsed: 1 },
        });
      }
    }

    log.info('orchestrator_call_ended', { callSid, duration });
  } catch (err) {
    log.error('orchestrator_call_end_error', { error: err.message, callSid });
  }
});

log.info('orchestrator_event_handlers_registered');
