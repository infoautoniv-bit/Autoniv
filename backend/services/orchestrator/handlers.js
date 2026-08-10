/**
 * Voice Orchestrator Event Handlers
 * Saves leads, appointments, and call data from custom voice agent
 */

import Agent from '../../db/models/Agent.js';
import Call from '../../db/models/Call.js';
import Lead from '../../db/models/Lead.js';
import Appointment from '../../db/models/Appointment.js';
import User from '../../db/models/User.js';
import { log } from '../logger.js';
import { parsePhoneWordsToDigits } from '../validators.js';
import { sendCrmWebhook } from '../crmService.js';

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

      if (call.userId) {
        const user = await User.findById(call.userId).lean();
        const agent = call.agentId ? await Agent.findById(call.agentId).lean() : null;
        sendCrmWebhook(user?.crmIntegrations?.webhookUrl || agent?.crmIntegrations?.webhookUrl, 'lead_captured', {
          callId: String(call._id),
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          purpose: lead.purpose,
          timestamp: new Date().toISOString(),
        }, user?.crmIntegrations?.webhookSecret || agent?.crmIntegrations?.webhookSecret, agent?.crmIntegrations || null);
      }
    } else if (toolName === 'saveAppointment') {
      const appointment = await Appointment.create({
        agentId: call.agentId,
        callId: call._id,
        userId: call.userId,
        name: args.name,
        phone: parsePhoneWordsToDigits(args.phone),
        email: args.email || null,
        service: args.service || 'General Consultation',
        preferredDate: args.preferredDate,
        preferredTime: args.preferredTime,
        status: 'pending',
      });

      log.info('orchestrator_appointment_saved', { appointmentId: appointment._id, callSid });

      if (call.userId) {
        const user = await User.findById(call.userId).lean();
        const agent = call.agentId ? await Agent.findById(call.agentId).lean() : null;
        sendCrmWebhook(user?.crmIntegrations?.webhookUrl || agent?.crmIntegrations?.webhookUrl, 'appointment_created', {
          callId: String(call._id),
          name: appointment.name,
          phone: appointment.phone,
          email: appointment.email,
          service: appointment.service,
          date: appointment.preferredDate,
          time: appointment.preferredTime,
          timestamp: new Date().toISOString(),
        }, user?.crmIntegrations?.webhookSecret || agent?.crmIntegrations?.webhookSecret, agent?.crmIntegrations || null);
      }
    }
  } catch (err) {
    log.error('orchestrator_tool_call_handler_error', { error: err.message, callSid, toolName });
  }
});

process.on('voiceAgentCallEnded', async ({ callSid, duration, transcript, summary }) => {
  try {
    const call = await Call.findOne({ vapiCallId: callSid });
    if (!call) {
      log.warn('orchestrator_call_ended_no_call', { callSid });
      return;
    }

    const updates = {
      status: 'completed',
      duration: Math.round(duration || 0),
      endedAt: new Date(),
      endedReason: 'normal_clearing',
    };
    if (transcript) updates.transcript = transcript;
    if (summary) updates.summary = summary;

    await Call.updateOne({ _id: call._id }, updates);

    if (updates.duration > 0 && call.userId && !call.billed) {
      const billingMinutes = Math.ceil(updates.duration / 60);
      const flip = await Call.findOneAndUpdate(
        { _id: call._id, billed: { $ne: true } },
        { $set: { billed: true } }
      );
      if (flip) {
        await User.findByIdAndUpdate(call.userId, { $inc: { minutesUsed: billingMinutes, callsUsed: 1 } });
        log.info('orchestrator_call_billed', { callSid, billingMinutes, userId: call.userId });
      }
    }

    log.info('orchestrator_call_ended_processed', { callSid, duration: updates.duration });
  } catch (err) {
    log.error('orchestrator_call_ended_handler_error', { error: err.message, callSid });
  }
});
