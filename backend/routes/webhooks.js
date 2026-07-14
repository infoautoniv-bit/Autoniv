import express from 'express';
import mongoose from 'mongoose';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Webhook from '../db/models/Webhook.js';
import User from '../db/models/User.js';
import { verifyVapiSignature } from '../middleware/webhookSignature.js';
import { enforceTwilioSignature } from '../middleware/twilioSignature.js';
import { webhookLimiter } from '../middleware/rateLimiters.js';
import { extractVapiCallData, getVapiCall } from '../services/vapi.js';
import { containsAbuse, sanitizeText } from '../services/contentModeration.js';
import { log, securityEvent, IS_PROD } from '../services/logger.js';
import { safeString } from '../services/validators.js';
import { decrypt } from '../services/encryption.js';
import { signMediaStreamToken } from '../services/mediaStreamToken.js';
import { executeTool } from '../services/appointmentTools.js';

const router = express.Router();

router.post('/vapi', webhookLimiter, async (req, res) => {
  const { type, message, call: topCall, transcript: topTranscript, functionCall } = req.body || {};
  const eventType = type || message?.type;
  log.info('webhook_received', { eventType, ip: req.ip });
  const rawCall = topCall
    || (message?.call
      ? { ...message, ...message.call, endedReason: message.endedReason ?? message.call.endedReason }
      : message);
  const callData = rawCall || {};
  const transcriptData = topTranscript || message?.transcript;

  const typeMap = { 'end-of-call-report': 'call-ended' };
  const mappedType = typeMap[eventType] || eventType;

  if (eventType === 'tool-calls') {
    log.debug('webhook_tool_calls_raw', { body: req.body });
    try {
      const toolCalls = message?.toolCallList || message?.toolCalls || [];

      if (toolCalls.length === 0) {
        return res.json({ messageResponse: { results: [] } });
      }

      const results = [];
      const toolCallCall = message?.call || callData;

      for (const tc of toolCalls) {
        const name = tc?.function?.name;
        let args = {};
        try {
          args = tc?.function?.arguments
            ? (typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments)
            : {};
        } catch {
          log.warn('webhook_tool_calls_parse_failed', { name });
        }

        const toolResult = await handleFunctionCall(toolCallCall, { name, parameters: args });
        const resultStr = toolResult?.success
          ? (toolResult.message || JSON.stringify(toolResult))
          : (toolResult?.error || 'Tool execution failed');
        results.push({ toolCallId: tc.id, name, result: resultStr });
      }

      return res.json({ messageResponse: { results } });
    } catch (e) {
      log.error('webhook_tool_calls_error', { error: e.message });
      return res.status(500).json({ messageResponse: { error: 'Internal error' } });
    }
  }

  if (mappedType === 'function-call') {
    try {
      const toolResult = await handleFunctionCall(callData, functionCall);
      const resultStr = toolResult?.success
        ? (toolResult.message || JSON.stringify(toolResult))
        : (toolResult?.error || 'Tool execution failed');
      return res.json({ messageResponse: { result: resultStr } });
    } catch (error) {
      log.error('webhook_function_call_error', { error: error.message });
      return res.status(500).json({ messageResponse: { error: 'Internal error' } });
    }
  }

  res.status(200).json({ received: true });

  try {
    await Webhook.create({
      type: safeString(eventType, 64, 'unknown'),
      payload: safeString(typeof req.body === 'string' ? req.body : JSON.stringify(req.body), 200000),
    });

    if (eventType === 'status-update') {
      const callStatus = callData.status ?? callData.call?.status;
      if (callStatus === 'in-progress') {
        await handleCallStarted(callData);
      }
    } else if (mappedType === 'call-started') {
      await handleCallStarted(callData);
    } else if (mappedType === 'call-ended') {
      await handleCallEnded(callData);
    } else if (mappedType === 'transcript') {
      await handleTranscript(callData, transcriptData);
    } else {
      const ignored = ['speech-update', 'conversation-update'];
      if (eventType && !ignored.includes(eventType)) {
        log.debug('webhook_unhandled_type', { eventType });
      }
    }
  } catch (error) {
    log.error('webhook_processing_error', { eventType, error: error.message });
  }
});

async function handleCallStarted(call) {
  if (!call?.id) return;

  const existing = await Call.findOne({ vapiCallId: call.id });
  if (existing) return;

  const { callerNumber, startedAt } = extractVapiCallData(call) || {};

  const agent = await Agent.findOne({ vapiId: call.assistantId }).lean();

  await Call.create({
    _id: call.id,
    agentId: agent?._id || null,
    userId: agent?.userId || null,
    vapiCallId: call.id,
    callerNumber: callerNumber ? safeString(callerNumber, 30) : null,
    status: 'in-progress',
    startedAt: startedAt || new Date().toISOString(),
  });

  if (!agent) {
    log.warn('webhook_call_started_no_agent', { vapiId: call.assistantId, callId: call.id });
  }
}

async function handleCallEnded(call) {
  if (!call?.id) return;

  const extracted = extractVapiCallData(call);
  if (!extracted) return;
  let { duration, callerNumber, endedAt, recordingUrl, endedReason, status: vapiStatus } = extracted;

  const statusMap = {
    'customer-ended-call': 'completed',
    'assistant-ended-call': 'completed',
    'silence-timed-out': 'missed',
    'max-duration-exceeded': 'completed',
    'error': 'failed',
  };
  const status = statusMap[endedReason] || statusMap[vapiStatus] || 'completed';

  // If webhook didn't include recordingUrl, fetch from Vapi REST API
  if (!recordingUrl) {
    try {
      const fullCallData = await getVapiCall(call.id);
      const fullExtracted = extractVapiCallData(fullCallData);
      recordingUrl = fullExtracted?.recordingUrl || null;
      if (recordingUrl) {
        log.info('webhook_recording_url_fetched_from_api', { callId: call.id });
      }
    } catch (e) {
      log.warn('webhook_recording_url_api_fetch_failed', { callId: call.id, error: e.message });
    }
  }

  const existing = await Call.findOne({ vapiCallId: call.id });
  if (!existing) return;

  const updates = {
    status,
    duration,
    recordingUrl,
    endedAt: endedAt || new Date().toISOString(),
    endedReason,
  };
  if (callerNumber && (!existing.callerNumber || existing.callerNumber === 'Unknown')) {
    updates.callerNumber = safeString(callerNumber, 30);
  }

  await Call.updateOne({ _id: existing._id }, updates);

  // If recordingUrl is still null, schedule a delayed retry
  if (!recordingUrl) {
    setTimeout(async () => {
      try {
        const retryData = await getVapiCall(call.id);
        const retryExtracted = extractVapiCallData(retryData);
        if (retryExtracted?.recordingUrl) {
          await Call.updateOne(
            { vapiCallId: call.id },
            { recordingUrl: retryExtracted.recordingUrl }
          );
          log.info('webhook_recording_url_delayed_fetch_success', { callId: call.id });
        }
      } catch (e) {
        log.warn('webhook_recording_url_delayed_fetch_failed', { callId: call.id, error: e.message });
      }
    }, 30000);
  }

  if (duration > 0) {
    const billingMinutes = Math.ceil(duration / 60);
    const flip = await Call.findOneAndUpdate(
      { vapiCallId: call.id, billed: { $ne: true } },
      { $set: { billed: true } }
    );
    if (flip) {
      await User.findByIdAndUpdate(existing.userId, { $inc: { minutesUsed: billingMinutes, callsUsed: 1 } });
      log.info('webhook_call_billed', { callId: call.id, billingMinutes });
    } else {
      log.info('webhook_call_already_billed', { callId: call.id });
    }
  }
}

async function handleTranscript(call, transcript) {
  if (!call?.id || !transcript) return;

  const safeTranscript = typeof transcript === 'string'
    ? transcript.slice(0, 200000)
    : JSON.stringify(transcript).slice(0, 200000);

  await Call.updateOne(
    { vapiCallId: call.id },
    { transcript: safeTranscript },
  );
}

// Per-call tool state (dedup guard), so repeat tool calls within one Vapi call
// don't create duplicate leads/bookings. Keyed by Vapi call id.
const _toolStateByCall = new Map();

function getToolState(callId) {
  if (!callId) return {};
  let state = _toolStateByCall.get(callId);
  if (!state) {
    state = {};
    _toolStateByCall.set(callId, state);
    // Bound memory: drop the state a few minutes after the call.
    setTimeout(() => _toolStateByCall.delete(callId), 10 * 60 * 1000).unref?.();
  }
  return state;
}

async function handleFunctionCall(call, functionCall) {
  if (!functionCall?.name) return { success: false, error: 'No function name' };

  const agent = await Agent.findOne({ vapiId: call?.assistantId });
  if (!agent) return { success: false, error: 'Agent not found' };

  // Delegate to the canonical tool executor so the webhook path and the
  // orchestrator path share identical validation, dedup, and tool coverage
  // (saveLead, checkAppointmentAvailability, saveAppointment, …).
  return executeTool(functionCall.name, functionCall.parameters || {}, {
    agentObj: agent,
    toolState: getToolState(call?.id),
    callId: call?.id || null,
  });
}

router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Webhook endpoint is reachable',
    events: {
      'tool-calls': 'POST /api/webhooks/vapi',
      'function-call': 'POST /api/webhooks/vapi',
      'status-update': 'POST /api/webhooks/vapi',
      'end-of-call-report': 'POST /api/webhooks/vapi',
      'transcript': 'POST /api/webhooks/vapi',
    },
  });
});

router.post('/incoming-call', async (req, res) => {
  const to = req.body.To || '';
  const from = req.body.From || 'Unknown';
  const callSid = req.body.CallSid;

  log.info('twilio_incoming_call', { from, to, callSid });

  let agent = null;
  try {
    const allAgents = await Agent.find({ phoneNumber: { $ne: null } }).lean();

    if (to) {
      const cleanTo = to.replace(/\D/g, '');
      agent = allAgents.find(a => {
        const cleanAgentNum = a.phoneNumber.replace(/\D/g, '');
        return cleanAgentNum === cleanTo ||
          (cleanAgentNum.length >= 10 && cleanTo.endsWith(cleanAgentNum.slice(-10))) ||
          (cleanTo.length >= 10 && cleanAgentNum.endsWith(cleanTo.slice(-10)));
      });
    }

    if (!agent && from && from !== 'Unknown') {
      const cleanFrom = from.replace(/\D/g, '');
      agent = allAgents.find(a => {
        const cleanAgentNum = a.phoneNumber.replace(/\D/g, '');
        return cleanAgentNum === cleanFrom ||
          (cleanAgentNum.length >= 10 && cleanFrom.endsWith(cleanAgentNum.slice(-10))) ||
          (cleanFrom.length >= 10 && cleanAgentNum.endsWith(cleanFrom.slice(-10)));
      });
    }

    if (!agent) {
      // Any call reaching /incoming-call is a custom-engine call (Vapi answers
      // its own numbers), so only fall back to a custom receptionist — never a
      // Vapi agent, which would be rejected downstream.
      log.warn('twilio_incoming_call_no_agent_resolved', { to, from });
      agent = await Agent.findOne({ type: 'receptionist', vapiId: null });
    }

    // Verify the request genuinely came from Twilio before acting on it.
    // Prefer the agent's own Twilio auth token, fall back to the account-wide env.
    const twilioToken = agent?.twilioAuthToken
      ? decrypt(agent.twilioAuthToken)
      : process.env.TWILIO_AUTH_TOKEN || null;
    if (!enforceTwilioSignature(req, twilioToken, { callSid, to, from })) {
      return res
        .status(403)
        .type('text/xml')
        .send(`<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>`);
    }

    if (agent) {
      // Use findOneAndUpdate with upsert to avoid duplicate key errors for outbound calls
      await Call.findOneAndUpdate(
        { vapiCallId: callSid },
        {
          $setOnInsert: {
            agentId: agent._id,
            userId: agent.userId,
            vapiCallId: callSid,
            callerNumber: req.body.Direction === 'outbound-api' ? to : from,
            status: 'in-progress',
            startedAt: new Date(),
          }
        },
        { upsert: true, new: true }
      );
      log.info('twilio_incoming_call_initialized_db', { callSid, agentId: agent._id, useCustomEngine: agent.useCustomEngine });
    }
  } catch (err) {
    log.error('twilio_incoming_call_db_failed', { error: err.message, callSid });
  }

  // Validate host header to prevent injection (must be hostname:port or hostname only).
  // Prefer the proxy-forwarded host so the wss URL matches the public endpoint;
  // take the first value when chained proxies send a comma-separated list.
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const VALID_HOST_REGEX = /^[a-zA-Z0-9._-]+(:\d{1,5})?$/;
  if (!host || !VALID_HOST_REGEX.test(host)) {
    log.warn('twilio_invalid_host_header', { host });
    return res.status(400).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }

  res.type('text/xml');

  // No agent could be resolved for this number — answer gracefully instead of
  // opening a media stream with no agent context.
  if (!agent) {
    log.warn('twilio_incoming_call_unresolved', { to, from, callSid });
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Sorry, no agent is available to take your call right now. Please try again later.</Say>
    <Hangup/>
</Response>`);
  }

  // Our WebSocket orchestrator handles custom-engine agents. The single source
  // of truth is `vapiId`: an agent WITHOUT a vapiId is a custom agent (its
  // Twilio number points here), while an agent WITH a vapiId is answered by
  // Vapi directly — reaching this webhook means that number is misconfigured.
  // We key off vapiId (not useCustomEngine) so the inbound path agrees with the
  // outbound path in routes/calls.js, which also branches on `!agent.vapiId`.
  const isCustomAgent = !agent.vapiId;
  if (!isCustomAgent) {
    log.warn('twilio_incoming_call_non_custom_agent', {
      agentId: agent._id?.toString(), vapiId: agent.vapiId, useCustomEngine: agent.useCustomEngine, callSid,
    });
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>This number is not configured for direct handling. Please contact support.</Say>
    <Hangup/>
</Response>`);
  }

  // Twilio Media Streams REQUIRE wss. Force it in production and whenever the
  // proxy reports https; tolerate comma-separated x-forwarded-proto values.
  const xfProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const isSecure = xfProto === 'https' || req.secure || IS_PROD;
  const protocol = isSecure ? 'wss' : 'ws';
  const agentId = agent._id.toString();
  // Short-lived signed token so only calls we just answered can open a stream.
  const streamToken = signMediaStreamToken(agentId);
  const tokenParam = streamToken ? `&token=${encodeURIComponent(streamToken)}` : '';
  const wsUrl = `${protocol}://${host}/media-stream?agentId=${agentId}${tokenParam}`;
  const escapedWsUrl = wsUrl.replace(/&/g, '&amp;');

  return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${escapedWsUrl}">
            <Parameter name="agentId" value="${agentId}" />
            <Parameter name="token" value="${streamToken || ''}" />
        </Stream>
    </Connect>
</Response>`);
});

export default router;
