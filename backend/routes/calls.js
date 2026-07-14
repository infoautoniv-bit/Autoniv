import mongoose from 'mongoose';
import express from 'express';
import Call from '../db/models/Call.js';
import Agent from '../db/models/Agent.js';
import User from '../db/models/User.js';
import { authenticate, requireAdmin, requireFeature, checkVoiceLimit } from '../middleware/auth.js';
import { log } from '../services/logger.js';
import { getVapiCalls, extractVapiCallData, createVapiOutboundCall } from '../services/vapi.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { decrypt } from '../services/encryption.js';
import { deleteRecording } from '../services/cloudinary.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('voice'));

// Normalize a call document for frontend consumption
function normalizeCall(c) {
  return {
    ...c,
    id: c._id?.toString(),
    agentId: c.agentId?._id?.toString() ?? c.agentId?.toString() ?? null,
    userId: c.userId?._id?.toString() ?? c.userId?.toString() ?? null,
    agentName: c.agentId?.name ?? null,
    agentType: c.agentId?.type ?? null,
    userName: c.userId?.name ?? null,
    userEmail: c.userId?.email ?? null,
  };
}

// Status mapping shared between sync routes
const STATUS_MAP = {
  ended: 'completed',
  'customer-ended-call': 'completed',
  'assistant-ended-call': 'completed',
  'silence-timed-out': 'missed',
  'max-duration-exceeded': 'completed',
  error: 'failed',
};

// GET /calls — admin: all calls
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [calls, total] = await Promise.all([
      Call.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit).populate('agentId', 'name type').populate('userId', 'name email').lean(),
      Call.countDocuments(filter),
    ]);

    res.json(paginatedResponse({ items: calls.map(normalizeCall), total, page, limit }));
  } catch (error) {
    log.error('get_all_calls_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
});

// GET /calls/my — current user's calls
router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const filter = { userId: new mongoose.Types.ObjectId(req.user.userId) };
    if (status) filter.status = status;

    const [calls, total] = await Promise.all([
      Call.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit).populate('agentId', 'name type').lean(),
      Call.countDocuments(filter),
    ]);

    res.json(paginatedResponse({ items: calls.map(normalizeCall), total, page, limit }));
  } catch (error) {
    log.error('get_my_calls_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
});

// GET /calls/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin
      ? {}
      : { userId: new mongoose.Types.ObjectId(req.user.userId) };

    const stats = await Call.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          completedCalls: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          missedCalls: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } },
          activeCalls: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          totalSeconds: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);

    const s = stats[0] || {};
    res.json({
      totalCalls: s.totalCalls || 0,
      completedCalls: s.completedCalls || 0,
      missedCalls: s.missedCalls || 0,
      activeCalls: s.activeCalls || 0,
      totalMinutes: Math.ceil((s.totalSeconds || 0) / 60),
      avgDuration: Math.round(s.avgDuration || 0),
    });
  } catch (error) {
    log.error('call_stats_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch call stats' });
  }
});

// GET /calls/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid call ID' });
    }

    const call = await Call.findById(id)
      .populate('agentId', 'name type')
      .lean();

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (req.user.role !== 'admin' && call.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ call: normalizeCall(call) });
  } catch (error) {
    log.error('get_call_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch call' });
  }
});

// DELETE /calls/:id — delete a call and its recording
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid call ID' });
    }

    const call = await Call.findById(id).lean();
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (req.user.role !== 'admin' && call.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (call.recordingUrl) {
      await deleteRecording(call.recordingUrl);
    }

    await Call.findByIdAndDelete(id);

    log.info('call_deleted', { callId: id, userId: req.user.userId });
    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    log.error('delete_call_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to delete call' });
  }
});

// POST /calls/sync — admin: sync all Vapi calls
router.post('/sync', requireAdmin, async (req, res) => {
  try {
    const vapiCalls = await getVapiCalls({ limit: 50 });

    if (!Array.isArray(vapiCalls)) {
      return res.status(502).json({ message: 'Unexpected response from Vapi' });
    }

    let synced = 0;
    let updated = 0;
    let skippedNoAgent = 0;

    for (const vapiCall of vapiCalls) {
      try {
        const agent = await Agent.findOne({ vapiId: vapiCall.assistantId }).lean();
        if (!agent) {
          skippedNoAgent++;
          continue;
        }

        const vapiData = extractVapiCallData(vapiCall);
        const status = STATUS_MAP[vapiData.endedReason ?? vapiData.status] ?? 'completed';

        const existing = await Call.findOne({ vapiCallId: vapiCall.id });
        if (existing) {
          const oldStatus = existing.status;
          await Call.updateOne(
            { _id: existing._id },
            {
              duration: vapiData.duration,
              status,
              recordingUrl: vapiData.recordingUrl,
              transcript: vapiData.transcript,
              startedAt: vapiData.startedAt,
              endedAt: vapiData.endedAt,
              endedReason: vapiData.endedReason,
              ...(vapiData.callerNumber ? { callerNumber: vapiData.callerNumber } : {}),
            }
          );
          if (oldStatus !== 'completed' && status === 'completed') {
            await User.findByIdAndUpdate(agent.userId, {
              $inc: {
                minutesUsed: Math.ceil((vapiData.duration || 0) / 60),
                callsUsed: 1
              }
            });
          }
          updated++;
        } else {
          await Call.create({
            agentId: agent._id,
            userId: agent.userId,
            vapiCallId: vapiCall.id,
            callerNumber: vapiData.callerNumber || null,
            duration: vapiData.duration,
            status,
            recordingUrl: vapiData.recordingUrl,
            transcript: vapiData.transcript,
            startedAt: vapiData.startedAt,
            endedAt: vapiData.endedAt,
            endedReason: vapiData.endedReason,
          });
          const incObj = { callsUsed: 1 };
          if (status === 'completed' && vapiData.duration > 0) {
            incObj.minutesUsed = Math.ceil(vapiData.duration / 60);
          }
          await User.findByIdAndUpdate(agent.userId, { $inc: incObj });
          synced++;
        }
      } catch (callErr) {
        log.warn('sync_call_error', { vapiCallId: vapiCall.id, error: callErr.message });
        // continue processing remaining calls
      }
    }

    res.json({ message: 'Sync complete', synced, updated, skippedNoAgent });
  } catch (error) {
    log.error('sync_calls_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to sync calls' });
  }
});

// POST /calls/sync-my — current user: sync their Vapi calls
router.post('/sync-my', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const agents = await Agent.find({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      vapiId: { $ne: null },
    }).lean();

    if (agents.length === 0) {
      return res.json({ message: 'No Vapi-linked agents found', synced: 0, skippedDuplicate: 0, skippedNoAgent: 0 });
    }

    const agentVapiIds = new Set(agents.map(a => a.vapiId));

    const vapiCalls = await getVapiCalls({ limit: 50 });
    if (!Array.isArray(vapiCalls) || vapiCalls.length === 0) {
      return res.json({ message: 'No calls from Vapi', synced: 0, skippedDuplicate: 0, skippedNoAgent: 0 });
    }

    let synced = 0;
    let skippedDuplicate = 0;
    let skippedNoAgent = 0;

    for (const vapiCall of vapiCalls) {
      try {
        if (!agentVapiIds.has(vapiCall.assistantId)) continue;

        const existing = await Call.findOne({ vapiCallId: vapiCall.id });
        if (existing) { skippedDuplicate++; continue; }

        const agent = agents.find(a => a.vapiId === vapiCall.assistantId);
        if (!agent) { skippedNoAgent++; continue; }

        const vapiData = extractVapiCallData(vapiCall);
        const status = STATUS_MAP[vapiData.endedReason ?? vapiData.status] ?? 'completed';

        await Call.create({
          agentId: agent._id,
          userId: agent.userId,
          vapiCallId: vapiCall.id,
          callerNumber: vapiData.callerNumber || null,
          duration: vapiData.duration,
          status,
          recordingUrl: vapiData.recordingUrl,
          transcript: vapiData.transcript,
          startedAt: vapiData.startedAt,
          endedAt: vapiData.endedAt,
        });
        const incObj = { callsUsed: 1 };
        if (status === 'completed' && vapiData.duration > 0) {
          incObj.minutesUsed = Math.ceil(vapiData.duration / 60);
        }
        await User.findByIdAndUpdate(agent.userId, { $inc: incObj });
        synced++;
      } catch (callErr) {
        log.warn('sync_my_call_error', { vapiCallId: vapiCall.id, error: callErr.message });
        // continue processing remaining calls
      }
    }

    res.json({ message: 'Sync complete', synced, skippedDuplicate, skippedNoAgent });
  } catch (error) {
    log.error('sync_my_calls_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to sync calls' });
  }
});

// POST /calls/outbound — initiate outbound call via Vapi
router.post('/outbound', checkVoiceLimit(), async (req, res) => {
  try {
    const { agentId, phoneNumber } = req.body;

    if (!agentId || !phoneNumber) {
      return res.status(400).json({ message: 'agentId and phoneNumber are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ message: 'Invalid agent ID' });
    }

    const phoneClean = phoneNumber.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{7,15}$/.test(phoneClean)) {
      return res.status(400).json({ message: 'Invalid phone number format. Use E.164 (e.g. +14155551234)' });
    }

    const agent = await Agent.findById(agentId).lean();
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    if (agent.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!agent.isActive) {
      return res.status(400).json({ message: 'Agent is not active. Enable it first.' });
    }

    const e164Number = phoneClean.startsWith('+') ? phoneClean : `+${phoneClean}`;

    if (!agent.vapiId) {
      // Check if we have Twilio credentials to make direct Twilio outbound call (agent-specific first, fallback to env)
      const accountSid = agent.twilioAccountSid ? decrypt(agent.twilioAccountSid) : process.env.TWILIO_ACCOUNT_SID;
      const authToken = agent.twilioAuthToken ? decrypt(agent.twilioAuthToken) : process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) {
        return res.status(400).json({
          message: 'To use custom outbound calls, please configure your Twilio Account SID and Twilio Auth Token in your agent settings or backend .env file.'
        });
      }

      const fromNumber = agent.phoneNumber || process.env.TWILIO_FROM_NUMBER;
      if (!fromNumber) {
        return res.status(400).json({
          message: 'No outbound caller ID number associated with this agent. Please link a Twilio phone number first.'
        });
      }

      // Calculate Twilio callback URL for incoming call
      const baseWebhookUrl = process.env.WEBHOOK_URL || `https://${req.headers.host}`;
      let twilioWebhookUrl;
      if (baseWebhookUrl.endsWith('/api/webhooks/vapi')) {
        twilioWebhookUrl = baseWebhookUrl.replace('/vapi', '/incoming-call');
      } else {
        const base = baseWebhookUrl.replace(/\/$/, '');
        twilioWebhookUrl = `${base}/api/webhooks/incoming-call`;
      }

      // Place Twilio outbound call using REST API
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
      const bodyParams = new URLSearchParams({
        To: e164Number,
        From: fromNumber,
        Url: twilioWebhookUrl,
      });

      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!twilioRes.ok) {
        const responseText = await twilioRes.text();
        throw new Error(`Twilio API Error (${twilioRes.status}): ${responseText}`);
      }

      const twilioCall = await twilioRes.json();

      // Create a local Call record to track the outbound call
      await Call.create({
        agentId: agent._id,
        userId: agent.userId,
        vapiCallId: twilioCall.sid,
        callerNumber: e164Number,
        status: 'in-progress',
        startedAt: new Date(),
      });

      log.info('twilio_outbound_call_initiated', {
        userId: req.user.userId,
        agentId,
        phoneNumber: e164Number,
        callSid: twilioCall.sid,
      });

      return res.json({ message: 'Twilio outbound call initiated', callId: twilioCall.sid });
    }

    const vapiCall = await createVapiOutboundCall({
      assistantId: agent.vapiId,
      phoneNumberId: agent.phoneNumberId,
      customer: { number: e164Number, name: req.user.userId },
    });

    log.info('outbound_call_initiated', {
      userId: req.user.userId,
      agentId,
      phoneNumber: e164Number,
      vapiCallId: vapiCall?.id,
    });

    return res.json({ message: 'Call initiated', callId: vapiCall?.id || null });
  } catch (error) {
    log.error('outbound_call_error', { error: error.message, userId: req.user?.userId });
    return res.status(500).json({ message: error.message || 'Failed to initiate call' });
  }
});

export default router;