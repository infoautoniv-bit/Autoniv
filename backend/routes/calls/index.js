import mongoose from 'mongoose';
import express from 'express';
import Call from '../../db/models/Call.js';
import Agent from '../../db/models/Agent.js';
import User from '../../db/models/User.js';
import PhoneNumber from '../../db/models/PhoneNumber.js';
import { authenticate, requireAdmin, requireFeature, checkVoiceLimit } from '../../middleware/auth.js';
import { log } from '../../services/logger.js';
import { getVapiCalls, extractVapiCallData, createVapiOutboundCall, createVapiAssistant } from '../../services/vapi.js';
import { parsePage, paginatedResponse } from '../../services/pagination.js';
import { decrypt, decryptCredentials } from '../../services/encryption.js';
import { deleteRecording } from '../../services/cloudinary.js';
import { platformHandlers } from '../../services/telephony/platforms.js';

const FETCH_TIMEOUT_MS = 15_000;
const fetchWithTimeout = (url, opts = {}) => fetch(url, { ...opts, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('voice'));

async function cleanupStaleCalls(userId) {
  try {
    const staleThreshold = new Date(Date.now() - 4 * 60 * 1000);
    const filter = {
      status: 'in-progress',
      startedAt: { $lt: staleThreshold },
    };
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);

    await Call.updateMany(filter, {
      $set: {
        status: 'failed',
        duration: 0,
      },
    });
  } catch (err) {
    log.error('cleanup_stale_calls_error', { error: err.message, userId });
  }
}

function normalizeCall(c) {
  let finalStatus = c.status;
  const isStale = c.status === 'in-progress' && c.startedAt && (Date.now() - new Date(c.startedAt).getTime() > 240000);
  if (isStale) {
    finalStatus = 'failed';
  }

  return {
    ...c,
    id: c._id?.toString(),
    status: finalStatus,
    agentId: c.agentId?._id?.toString() ?? c.agentId?.toString() ?? null,
    userId: c.userId?._id?.toString() ?? c.userId?.toString() ?? null,
    agentName: c.agentId?.name ?? null,
    agentType: c.agentId?.type ?? null,
    userName: c.userId?.name ?? null,
    userEmail: c.userId?.email ?? null,
  };
}

const STATUS_MAP = {
  ended: 'completed',
  'customer-ended-call': 'completed',
  'assistant-ended-call': 'completed',
  'silence-timed-out': 'missed',
  'max-duration-exceeded': 'completed',
  error: 'failed',
};

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

router.get('/my', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const { page, limit, skip } = parsePage(req.query);
    const { status } = req.query;

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

router.post('/sync', requireAdmin, async (req, res) => {
  try {
    const vapiCalls = await getVapiCalls({ limit: 50 });

    if (!Array.isArray(vapiCalls)) {
      return res.status(502).json({ message: 'Unexpected response from Vapi' });
    }

    const assistantIds = [...new Set(vapiCalls.map(c => c.assistantId).filter(Boolean))];
    const agents = assistantIds.length > 0
      ? await Agent.find({ vapiId: { $in: assistantIds } }).lean()
      : [];
    const agentByVapiId = new Map(agents.map(a => [a.vapiId, a]));

    const vapiCallIds = vapiCalls.map(c => c.id).filter(Boolean);
    const existingCalls = vapiCallIds.length > 0
      ? await Call.find({ vapiCallId: { $in: vapiCallIds } }).lean()
      : [];
    const existingByVapiId = new Map(existingCalls.map(c => [c.vapiCallId, c]));

    let synced = 0;
    let updated = 0;
    let skippedNoAgent = 0;

    const bulkOps = [];
    const userIncMap = new Map();

    for (const vapiCall of vapiCalls) {
      try {
        const agent = agentByVapiId.get(vapiCall.assistantId);
        if (!agent) {
          skippedNoAgent++;
          continue;
        }

        const vapiData = extractVapiCallData(vapiCall);
        const status = STATUS_MAP[vapiData.endedReason ?? vapiData.status] ?? 'completed';
        const existing = existingByVapiId.get(vapiCall.id);

        if (existing) {
          const oldStatus = existing.status;
          bulkOps.push({
            updateOne: {
              filter: { _id: existing._id },
              update: {
                duration: vapiData.duration,
                status,
                recordingUrl: vapiData.recordingUrl,
                transcript: vapiData.transcript,
                startedAt: vapiData.startedAt,
                endedAt: vapiData.endedAt,
                endedReason: vapiData.endedReason,
                ...(vapiData.callerNumber ? { callerNumber: vapiData.callerNumber } : {}),
              }
            }
          });
          if (oldStatus !== 'completed' && status === 'completed') {
            const userId = String(agent.userId);
            const inc = userIncMap.get(userId) || { minutesUsed: 0, callsUsed: 0 };
            inc.minutesUsed += Math.ceil((vapiData.duration || 0) / 60);
            inc.callsUsed += 1;
            userIncMap.set(userId, inc);
          }
          updated++;
        } else {
          bulkOps.push({
            insertOne: {
              document: {
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
              }
            }
          });
          const userId = String(agent.userId);
          const inc = userIncMap.get(userId) || { minutesUsed: 0, callsUsed: 0 };
          inc.callsUsed += 1;
          if (status === 'completed' && vapiData.duration > 0) {
            inc.minutesUsed += Math.ceil(vapiData.duration / 60);
          }
          userIncMap.set(userId, inc);
          synced++;
        }
      } catch (callErr) {
        log.warn('sync_call_error', { vapiCallId: vapiCall.id, error: callErr.message });
      }
    }

    if (bulkOps.length > 0) {
      await Call.bulkWrite(bulkOps, { ordered: false });
    }

    for (const [userId, inc] of userIncMap) {
      await User.findByIdAndUpdate(userId, { $inc: inc });
    }

    res.json({ message: 'Sync complete', synced, updated, skippedNoAgent });
  } catch (error) {
    log.error('sync_calls_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to sync calls' });
  }
});

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
      }
    }

    res.json({ message: 'Sync complete', synced, skippedDuplicate, skippedNoAgent });
  } catch (error) {
    log.error('sync_my_calls_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to sync calls' });
  }
});

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

    let currentVapiId = agent.vapiId;

    if (!currentVapiId && !agent.useCustomEngine && process.env.VAPI_API_KEY) {
      try {
        const vapiAssistant = await createVapiAssistant({
          name: agent.name,
          type: agent.type || 'receptionist',
          prompt: agent.prompt || '',
          language: agent.language || 'en',
          voiceId: agent.voiceId || 'vapi:jennifer',
          userId: agent.userId,
        });
        if (vapiAssistant && vapiAssistant.id) {
          currentVapiId = vapiAssistant.id;
          await Agent.findByIdAndUpdate(agent._id, { vapiId: currentVapiId });
        }
      } catch (vapiErr) {
        log.warn('vapi_auto_create_assistant_failed', { error: vapiErr.message, agentId: agent._id });
      }
    }

    if (!currentVapiId) {
      const rawNum = (agent.phoneNumber || agent.phoneNumberId || '').replace(/[\s\-()]/g, '');
      const numOrNull = rawNum ? (rawNum.startsWith('+') ? rawNum : `+${rawNum}`) : null;
      const numWithoutPlus = rawNum ? rawNum.replace(/^\+/, '') : null;

      const orConditions = [
        { assignedToAgent: agent._id },
      ];
      if (agent.phoneNumber) orConditions.push({ phoneNumber: agent.phoneNumber });
      if (numOrNull) orConditions.push({ phoneNumber: numOrNull });
      if (numWithoutPlus) orConditions.push({ phoneNumber: numWithoutPlus });
      if (agent.phoneNumberId && mongoose.Types.ObjectId.isValid(agent.phoneNumberId)) {
        orConditions.push({ _id: agent.phoneNumberId });
      }

      let phoneDoc = await PhoneNumber.findOne({
        userId: agent.userId,
        $or: orConditions,
      }).lean();

      if (!phoneDoc) {
        if (agent.phoneNumberId && mongoose.Types.ObjectId.isValid(agent.phoneNumberId)) {
          phoneDoc = await PhoneNumber.findById(agent.phoneNumberId).lean();
        }
        if (!phoneDoc && agent.phoneNumber) {
          const rawNum = agent.phoneNumber.replace(/\D/g, '');
          phoneDoc = await PhoneNumber.findOne({
            userId: agent.userId,
            $or: [
              { phoneNumber: agent.phoneNumber },
              { phoneNumber: { $regex: rawNum.slice(-10) + '$' } }
            ]
          }).lean();
        }
        if (!phoneDoc) {
          phoneDoc = await PhoneNumber.findOne({ userId: agent.userId })
            .sort({ createdAt: -1 })
            .lean();
        }
      }

      let platform = 'twilio';
      let credentials = {};
      if (phoneDoc) {
        platform = phoneDoc.platform || 'twilio';
        credentials = decryptCredentials(phoneDoc.credentials || {});
      }

      if (!phoneDoc) {
        platform = agent.twilioAccountSid ? 'twilio' : (process.env.TWILIO_ACCOUNT_SID ? 'twilio' : 'twilio');
      }

      const fromNumber = agent.phoneNumber || (phoneDoc ? phoneDoc.phoneNumber : null) || process.env.TWILIO_FROM_NUMBER;

      log.info('outbound_credentials_resolved', {
        agentId: agent._id,
        phoneNumber: fromNumber,
        platform,
        hasPhoneDoc: !!phoneDoc,
        credentialKeys: Object.keys(credentials),
      });

      if (!fromNumber) {
        return res.status(400).json({
          message: 'No outbound caller ID number associated with this agent. Please link or select a phone number first.'
        });
      }

      const baseWebhookUrl = process.env.WEBHOOK_URL || `https://${req.headers.host}`;
      let webhookUrl;
      let statusCallbackUrl;
      if (baseWebhookUrl.endsWith('/api/webhooks/vapi')) {
        webhookUrl = `${baseWebhookUrl.replace('/vapi', '/incoming-call')}?agentId=${agent._id}`;
        statusCallbackUrl = baseWebhookUrl.replace('/vapi', '/twilio/status');
      } else {
        const base = baseWebhookUrl.replace(/\/$/, '');
        webhookUrl = `${base}/api/webhooks/incoming-call?agentId=${agent._id}`;
        statusCallbackUrl = `${base}/api/webhooks/twilio/status`;
      }

      let callSid = `call_${Date.now()}`;

      const handler = platformHandlers[platform] || platformHandlers.twilio;
      const { callSid: resolvedCallSid } = await handler({
        fromNumber,
        e164Number,
        webhookUrl,
        statusCallbackUrl,
        credentials,
        agent,
        host: req.headers.host,
        platform,
      });
      callSid = resolvedCallSid;

      await Call.create({
        agentId: agent._id,
        userId: agent.userId,
        vapiCallId: callSid,
        callerNumber: e164Number,
        status: 'in-progress',
        startedAt: new Date(),
      });

      log.info('outbound_call_initiated', {
        userId: req.user.userId,
        agentId,
        phoneNumber: e164Number,
        callSid: callSid,
      });

      return res.json({ message: 'Outbound call initiated', callId: callSid });
    }

    const vapiCall = await createVapiOutboundCall({
      assistantId: currentVapiId,
      phoneNumberId: agent.phoneNumberId,
      customer: { number: e164Number, name: req.user.userId },
    });

    if (vapiCall && vapiCall.id) {
      try {
        await Call.create({
          agentId: agent._id,
          userId: agent.userId,
          vapiCallId: vapiCall.id,
          callerNumber: e164Number,
          status: 'in-progress',
          startedAt: new Date(),
        });
      } catch (dbErr) {
        log.error('vapi_outbound_call_db_init_failed', { error: dbErr.message, callId: vapiCall.id });
      }
    }

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
