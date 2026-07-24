import mongoose from 'mongoose';
import express from 'express';
import Call from '../db/models/Call.js';
import Agent from '../db/models/Agent.js';
import User from '../db/models/User.js';
import PhoneNumber from '../db/models/PhoneNumber.js';
import { authenticate, requireAdmin, requireFeature, checkVoiceLimit } from '../middleware/auth.js';
import { log } from '../services/logger.js';
import { getVapiCalls, extractVapiCallData, createVapiOutboundCall, createVapiAssistant } from '../services/vapi.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { decrypt, decryptCredentials } from '../services/encryption.js';
import { deleteRecording } from '../services/cloudinary.js';

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
  } catch (_) {}
}

// Normalize a call document for frontend consumption
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
    await cleanupStaleCalls(null);
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
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    await cleanupStaleCalls(req.user.userId);
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
      // Lookup registered phone number document if available
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

      // Calculate callback URLs
      const baseWebhookUrl = process.env.WEBHOOK_URL || `https://${req.headers.host}`;
      let webhookUrl;
      let statusCallbackUrl;
      if (baseWebhookUrl.endsWith('/api/webhooks/vapi')) {
        webhookUrl = baseWebhookUrl.replace('/vapi', '/incoming-call');
        statusCallbackUrl = baseWebhookUrl.replace('/vapi', '/twilio/status');
      } else {
        const base = baseWebhookUrl.replace(/\/$/, '');
        webhookUrl = `${base}/api/webhooks/incoming-call`;
        statusCallbackUrl = `${base}/api/webhooks/twilio/status`;
      }

      let callSid = `call_${Date.now()}`;

      if (platform === 'exotel') {
        const sid = credentials.accountSid || credentials.subdomain || process.env.EXOTEL_ACCOUNT_SID;
        const apiKey = credentials.apiKey || process.env.EXOTEL_API_KEY;
        const apiToken = credentials.apiToken || credentials.authToken || process.env.EXOTEL_API_TOKEN;

        if (!sid || !apiKey || !apiToken) {
          return res.status(400).json({ message: 'Exotel credentials incomplete. Account SID, API Key, and API Token are required.' });
        }

        let cleanFromNumber = fromNumber.replace(/\D/g, '');
        let cleanE164Number = e164Number.replace(/\D/g, '');
        if (cleanE164Number.length === 10) cleanE164Number = `0${cleanE164Number}`;
        if (cleanFromNumber.length === 10) cleanFromNumber = `0${cleanFromNumber}`;

        const base = (process.env.WEBHOOK_URL || `https://${req.headers.host}`).replace(/\/api\/webhooks\/vapi$/, '').replace(/\/$/, '');
        const exoMlUrl = credentials.url || `${base}/api/webhooks/exotel/exoml`;
        const streamUrl = credentials.streamUrl || process.env.EXOTEL_STREAM_URL || `wss://${req.headers.host}/exotel-stream`;

        const exotelUrl = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;
        const params = new URLSearchParams({
          From: cleanE164Number,
          CallerId: cleanFromNumber,
          Url: exoMlUrl,
          StreamUrl: streamUrl,
          StreamType: 'bidirectional',
          Record: 'true',
          StatusCallback: statusCallbackUrl,
        });

        const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
        const exoRes = await fetch(exotelUrl, {
          method: 'POST',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        const exoText = await exoRes.text();
        if (!exoRes.ok) {
          throw new Error(`Exotel API Error (${exoRes.status}): ${exoText}`);
        }
        let exoData; try { exoData = JSON.parse(exoText); } catch (_) { exoData = {}; }
        callSid = exoData?.Call?.Sid || exoData?.sid || `exo_${Date.now()}`;
      } else if (platform === 'plivo') {
        const authId = credentials.authId || credentials.accountSid || process.env.PLIVO_AUTH_ID;
        const authToken = credentials.authToken || credentials.apiToken || process.env.PLIVO_AUTH_TOKEN;

        if (!authId || !authToken) {
          return res.status(400).json({ message: 'Plivo credentials incomplete. Auth ID and Auth Token are required.' });
        }

        const plivoUrl = `https://api.plivo.com/v1/Account/${authId}/Call/`;
        const authHeader = 'Basic ' + Buffer.from(`${authId}:${authToken}`).toString('base64');
        const plivoRes = await fetch(plivoUrl, {
          method: 'POST',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromNumber, to: e164Number, answer_url: webhookUrl, callback_url: statusCallbackUrl })
        });

        const plivoText = await plivoRes.text();
        if (!plivoRes.ok) {
          throw new Error(`Plivo API Error (${plivoRes.status}): ${plivoText}`);
        }
        let plivoData; try { plivoData = JSON.parse(plivoText); } catch (_) { plivoData = {}; }
        callSid = plivoData?.request_uuid || `plivo_${Date.now()}`;
      } else if (platform === 'ozonetel') {
        const apiKey = credentials.apiKey || process.env.OZONETEL_API_KEY;
        const customerName = credentials.customerName || process.env.OZONETEL_CUSTOMER_NAME;
        if (!apiKey || !customerName) {
          return res.status(400).json({ message: 'Ozonetel credentials incomplete. API Key and Customer Name are required.' });
        }
        let cleanFromNumber = fromNumber.replace(/\D/g, '');
        let cleanE164Number = e164Number.replace(/\D/g, '');
        const ozUrl = `https://in1-ccc.ozonetel.com/api/v1/Campaigns/ManualDial`;
        const params = new URLSearchParams({
          apiKey,
          customerName,
          phoneNumber: cleanE164Number,
          did: cleanFromNumber,
          url: webhookUrl,
        });
        const ozRes = await fetch(`${ozUrl}?${params.toString()}`, { method: 'POST' });
        const ozText = await ozRes.text();
        if (!ozRes.ok) throw new Error(`Ozonetel API Error (${ozRes.status}): ${ozText}`);
        let ozData; try { ozData = JSON.parse(ozText); } catch (_) { ozData = {}; }
        callSid = ozData?.id || ozData?.callId || `oz_${Date.now()}`;
      } else if (platform === 'mcube') {
        const apiKey = credentials.apiKey || process.env.MCUBE_API_KEY;
        if (!apiKey) return res.status(400).json({ message: 'MCUBE credentials incomplete. API Key is required.' });
        let cleanFromNumber = fromNumber.replace(/\D/g, '');
        let cleanE164Number = e164Number.replace(/\D/g, '');
        const mcRes = await fetch('https://mcube.vmpl.co.in/api/outbound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apikey: apiKey, exphone: cleanFromNumber, callto: cleanE164Number, url: webhookUrl })
        });
        const mcText = await mcRes.text();
        if (!mcRes.ok) throw new Error(`MCUBE API Error (${mcRes.status}): ${mcText}`);
        let mcData; try { mcData = JSON.parse(mcText); } catch (_) { mcData = {}; }
        callSid = mcData?.callid || mcData?.id || `mc_${Date.now()}`;
      } else if (platform === 'tatatele') {
        const authKey = credentials.authKey || process.env.TATATELE_AUTH_KEY;
        if (!authKey) return res.status(400).json({ message: 'Tata Tele credentials incomplete. Auth Key is required.' });
        const tataRes = await fetch('https://tatathr.in/api/v1/outbound', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
        });
        const tataText = await tataRes.text();
        if (!tataRes.ok) throw new Error(`Tata Tele API Error (${tataRes.status}): ${tataText}`);
        let tataData; try { tataData = JSON.parse(tataText); } catch (_) { tataData = {}; }
        callSid = tataData?.id || tataData?.call_id || `tata_${Date.now()}`;
      } else if (platform === 'maqsam') {
        const accessKey = credentials.accessKey || process.env.MAQSAM_ACCESS_KEY;
        const secretKey = credentials.secretKey || process.env.MAQSAM_SECRET_KEY;
        if (!accessKey || !secretKey) return res.status(400).json({ message: 'Maqsam credentials incomplete. Access Key and Secret Key are required.' });
        const authHeader = 'Basic ' + Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
        const maqRes = await fetch('https://api.maqsam.com/v1/calls', {
          method: 'POST',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
        });
        const maqText = await maqRes.text();
        if (!maqRes.ok) throw new Error(`Maqsam API Error (${maqRes.status}): ${maqText}`);
        let maqData; try { maqData = JSON.parse(maqText); } catch (_) { maqData = {}; }
        callSid = maqData?.id || `maq_${Date.now()}`;
      } else if (platform === 'vobiz') {
        const apiKey = credentials.apiKey || process.env.VOBIZ_API_KEY;
        if (!apiKey) return res.status(400).json({ message: 'Vobiz credentials incomplete. API Key is required.' });
        const vobRes = await fetch('https://api.vobiz.io/v1/Calls', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromNumber, to: e164Number, answer_url: webhookUrl })
        });
        const vobText = await vobRes.text();
        if (!vobRes.ok) throw new Error(`Vobiz API Error (${vobRes.status}): ${vobText}`);
        let vobData; try { vobData = JSON.parse(vobText); } catch (_) { vobData = {}; }
        callSid = vobData?.id || `vob_${Date.now()}`;
      } else if (platform === 'voicelink') {
        const apiKey = credentials.apiKey || process.env.VOICELINK_API_KEY;
        if (!apiKey) return res.status(400).json({ message: 'VoiceLink credentials incomplete. API Key is required.' });
        const vlRes = await fetch('https://api.voicelink.com/v1/calls', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
        });
        const vlText = await vlRes.text();
        if (!vlRes.ok) throw new Error(`VoiceLink API Error (${vlRes.status}): ${vlText}`);
        let vlData; try { vlData = JSON.parse(vlText); } catch (_) { vlData = {}; }
        callSid = vlData?.id || `vl_${Date.now()}`;
      } else if (platform === 'signalwire') {
        const projectId = credentials.projectId || process.env.SIGNALWIRE_PROJECT_ID;
        const apiToken = credentials.apiToken || process.env.SIGNALWIRE_API_TOKEN;
        const spaceUrl = credentials.spaceUrl || process.env.SIGNALWIRE_SPACE_URL;
        if (!projectId || !apiToken || !spaceUrl) {
          return res.status(400).json({ message: 'SignalWire credentials incomplete. Project ID, API Token, and Space URL are required.' });
        }
        const cleanSpaceUrl = spaceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const swUrl = `https://${cleanSpaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Calls.json`;
        const bodyParams = new URLSearchParams({ To: e164Number, From: fromNumber, Url: webhookUrl, StatusCallback: statusCallbackUrl });
        const basicAuth = Buffer.from(`${projectId}:${apiToken}`).toString('base64');
        const swRes = await fetch(swUrl, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString()
        });
        const swText = await swRes.text();
        if (!swRes.ok) throw new Error(`SignalWire API Error (${swRes.status}): ${swText}`);
        let swData; try { swData = JSON.parse(swText); } catch (_) { swData = {}; }
        callSid = swData?.sid || `sw_${Date.now()}`;
      } else if (platform === 'retell') {
        const apiKey = credentials.apiKey || process.env.RETELL_API_KEY;
        const phoneId = credentials.phoneNumberId || agent.phoneNumberId;
        if (!apiKey) return res.status(400).json({ message: 'Retell AI credentials incomplete. API Key is required.' });
        const retRes = await fetch('https://api.retellai.com/v2/create-phone-call', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from_number: fromNumber, to_number: e164Number, override_agent_id: agent.vapiId || undefined })
        });
        const retText = await retRes.text();
        if (!retRes.ok) throw new Error(`Retell AI Error (${retRes.status}): ${retText}`);
        let retData; try { retData = JSON.parse(retText); } catch (_) { retData = {}; }
        callSid = retData?.call_id || `ret_${Date.now()}`;
      } else if (platform === 'custom') {
        const endpoint = credentials.sipEndpoint || credentials.webhookUrl;
        const apiKey = credentials.apiKey;
        if (!endpoint) return res.status(400).json({ message: 'Custom / SIP credentials incomplete. SIP Endpoint or Webhook URL is required.' });
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const custRes = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ from: fromNumber, to: e164Number, webhookUrl })
        });
        const custText = await custRes.text();
        if (!custRes.ok) throw new Error(`Custom SIP API Error (${custRes.status}): ${custText}`);
        let custData; try { custData = JSON.parse(custText); } catch (_) { custData = {}; }
        callSid = custData?.id || custData?.callSid || `cust_${Date.now()}`;
      } else {
        // Default Twilio platform
        let accountSid = agent.twilioAccountSid ? decrypt(agent.twilioAccountSid) : (credentials.accountSid || credentials.accountSidKey || credentials.apiKey || process.env.TWILIO_ACCOUNT_SID);
        let authToken = agent.twilioAuthToken ? decrypt(agent.twilioAuthToken) : (credentials.authToken || credentials.apiSecret || credentials.apiToken || process.env.TWILIO_AUTH_TOKEN);

        if (!accountSid || !authToken) {
          return res.status(400).json({
            message: `To make calls with ${platform.toUpperCase()}, please configure account credentials in Phone Numbers settings or environment variables.`
          });
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
        const bodyParams = new URLSearchParams({
          To: e164Number,
          From: fromNumber,
          Url: webhookUrl,
          StatusCallback: statusCallbackUrl,
          StatusCallbackMethod: 'POST',
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
        callSid = twilioCall.sid;
      }

      // Create a local Call record to track the outbound call
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