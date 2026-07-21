import mongoose from 'mongoose';
import BulkCampaign from '../db/models/BulkCampaign.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import User from '../db/models/User.js';
import PhoneNumber from '../db/models/PhoneNumber.js';
import { log } from './logger.js';
import { decrypt } from './encryption.js';
import { createVapiOutboundCall } from './vapi.js';

// Active campaigns being processed (in-memory map of campaignId -> abort flag)
const activeCampaigns = new Map();

export function isCampaignActive(campaignId) {
  return activeCampaigns.has(campaignId);
}

export function pauseCampaign(campaignId) {
  const flag = activeCampaigns.get(campaignId);
  if (flag) flag.paused = true;
}

export function cancelCampaign(campaignId) {
  const flag = activeCampaigns.get(campaignId);
  if (flag) flag.cancelled = true;
}

async function placeTwilioCall(agent, e164Number, campaign) {
  const rawNum = (agent.phoneNumber || agent.phoneNumberId || campaign?.twilioPhoneNumber || '').replace(/[\s\-()]/g, '');
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

  if (!phoneDoc && !agent.phoneNumber && !agent.phoneNumberId && !campaign?.twilioPhoneNumber) {
    phoneDoc = await PhoneNumber.findOne({ userId: agent.userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  let platform = 'twilio';
  let credentials = {};
  if (phoneDoc) {
    const rawPhoneDocNum = (phoneDoc.phoneNumber || '').replace(/\D/g, '');
    const rawAgentNum = (campaign?.twilioPhoneNumber || agent.phoneNumber || '').replace(/\D/g, '');
    const isMatch = rawAgentNum && rawPhoneDocNum
      ? (rawPhoneDocNum.endsWith(rawAgentNum.slice(-10)) || rawAgentNum.endsWith(rawPhoneDocNum.slice(-10)))
      : (!rawAgentNum || (phoneDoc.assignedToAgent && phoneDoc.assignedToAgent.toString() === agent._id.toString()));

    if (isMatch) {
      platform = phoneDoc.platform || 'twilio';
      credentials = phoneDoc.credentials || {};
    } else {
      phoneDoc = null;
    }
  }

  if (!phoneDoc) {
    platform = agent.twilioAccountSid ? 'twilio' : (process.env.TWILIO_ACCOUNT_SID ? 'twilio' : 'twilio');
  }

  const fromNumber = campaign?.twilioPhoneNumber || agent.phoneNumber || (phoneDoc ? phoneDoc.phoneNumber : null) || process.env.TWILIO_FROM_NUMBER;

  log.info('bulk_outbound_credentials_resolved', {
    agentId: agent._id,
    phoneNumber: fromNumber,
    platform,
    hasPhoneDoc: !!phoneDoc,
    credentialKeys: Object.keys(credentials),
  });

  if (!fromNumber) throw new Error('No outbound caller ID number associated with this agent or campaign');

  const baseWebhookUrl = process.env.WEBHOOK_URL || '';
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

  if (platform === 'exotel') {
    const sid = credentials.accountSid || credentials.subdomain || process.env.EXOTEL_ACCOUNT_SID;
    const apiKey = credentials.apiKey || process.env.EXOTEL_API_KEY;
    const apiToken = credentials.apiToken || credentials.authToken || process.env.EXOTEL_API_TOKEN;

    if (!sid || !apiKey || !apiToken) throw new Error('Exotel credentials incomplete. Account SID/Subdomain, API Key, and API Token are required.');

    let cleanFromNumber = fromNumber.replace(/\D/g, '');
    let cleanE164Number = e164Number.replace(/\D/g, '');
    if (cleanE164Number.length === 10) cleanE164Number = `0${cleanE164Number}`;
    if (cleanFromNumber.length === 10) cleanFromNumber = `0${cleanFromNumber}`;

    const exotelUrl = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;
    const params = new URLSearchParams({
      From: cleanE164Number,
      CallerId: cleanFromNumber,
      Url: webhookUrl,
      StatusCallback: statusCallbackUrl,
      CallType: 'trans',
    });
    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
    const exoRes = await fetch(exotelUrl, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const exoText = await exoRes.text();
    if (!exoRes.ok) throw new Error(`Exotel API Error (${exoRes.status}): ${exoText}`);
    let exoData; try { exoData = JSON.parse(exoText); } catch (_) { exoData = {}; }
    return { sid: exoData?.Call?.Sid || exoData?.sid || `exo_${Date.now()}` };
  }

  if (platform === 'plivo') {
    const authId = credentials.authId || credentials.accountSid || process.env.PLIVO_AUTH_ID;
    const authToken = credentials.authToken || credentials.apiToken || process.env.PLIVO_AUTH_TOKEN;

    if (!authId || !authToken) throw new Error('Plivo credentials incomplete. Auth ID and Auth Token are required.');

    const plivoUrl = `https://api.plivo.com/v1/Account/${authId}/Call/`;
    const authHeader = 'Basic ' + Buffer.from(`${authId}:${authToken}`).toString('base64');
    const plivoRes = await fetch(plivoUrl, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber, to: e164Number, answer_url: webhookUrl, callback_url: statusCallbackUrl })
    });

    const plivoText = await plivoRes.text();
    if (!plivoRes.ok) throw new Error(`Plivo API Error (${plivoRes.status}): ${plivoText}`);
    let plivoData; try { plivoData = JSON.parse(plivoText); } catch (_) { plivoData = {}; }
    return { sid: plivoData?.request_uuid || `plivo_${Date.now()}` };
  }

  if (platform === 'ozonetel') {
    const apiKey = credentials.apiKey || process.env.OZONETEL_API_KEY;
    const customerName = credentials.customerName || process.env.OZONETEL_CUSTOMER_NAME;
    if (!apiKey || !customerName) throw new Error('Ozonetel credentials incomplete. API Key and Customer Name are required.');
    let cleanFromNumber = fromNumber.replace(/\D/g, '');
    let cleanE164Number = e164Number.replace(/\D/g, '');
    const ozUrl = `https://in1-ccc.ozonetel.com/api/v1/Campaigns/ManualDial`;
    const params = new URLSearchParams({ apiKey, customerName, phoneNumber: cleanE164Number, did: cleanFromNumber, url: webhookUrl });
    const ozRes = await fetch(`${ozUrl}?${params.toString()}`, { method: 'POST' });
    const ozText = await ozRes.text();
    if (!ozRes.ok) throw new Error(`Ozonetel API Error (${ozRes.status}): ${ozText}`);
    let ozData; try { ozData = JSON.parse(ozText); } catch (_) { ozData = {}; }
    return { sid: ozData?.id || ozData?.callId || `oz_${Date.now()}` };
  }

  if (platform === 'mcube') {
    const apiKey = credentials.apiKey || process.env.MCUBE_API_KEY;
    if (!apiKey) throw new Error('MCUBE credentials incomplete. API Key is required.');
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
    return { sid: mcData?.callid || mcData?.id || `mc_${Date.now()}` };
  }

  if (platform === 'tatatele') {
    const authKey = credentials.authKey || process.env.TATATELE_AUTH_KEY;
    if (!authKey) throw new Error('Tata Tele credentials incomplete. Auth Key is required.');
    const tataRes = await fetch('https://tatathr.in/api/v1/outbound', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
    });
    const tataText = await tataRes.text();
    if (!tataRes.ok) throw new Error(`Tata Tele API Error (${tataRes.status}): ${tataText}`);
    let tataData; try { tataData = JSON.parse(tataText); } catch (_) { tataData = {}; }
    return { sid: tataData?.id || tataData?.call_id || `tata_${Date.now()}` };
  }

  if (platform === 'maqsam') {
    const accessKey = credentials.accessKey || process.env.MAQSAM_ACCESS_KEY;
    const secretKey = credentials.secretKey || process.env.MAQSAM_SECRET_KEY;
    if (!accessKey || !secretKey) throw new Error('Maqsam credentials incomplete. Access Key and Secret Key are required.');
    const authHeader = 'Basic ' + Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
    const maqRes = await fetch('https://api.maqsam.com/v1/calls', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
    });
    const maqText = await maqRes.text();
    if (!maqRes.ok) throw new Error(`Maqsam API Error (${maqRes.status}): ${maqText}`);
    let maqData; try { maqData = JSON.parse(maqText); } catch (_) { maqData = {}; }
    return { sid: maqData?.id || `maq_${Date.now()}` };
  }

  if (platform === 'vobiz') {
    const apiKey = credentials.apiKey || process.env.VOBIZ_API_KEY;
    if (!apiKey) throw new Error('Vobiz credentials incomplete. API Key is required.');
    const vobRes = await fetch('https://api.vobiz.io/v1/Calls', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber, to: e164Number, answer_url: webhookUrl })
    });
    const vobText = await vobRes.text();
    if (!vobRes.ok) throw new Error(`Vobiz API Error (${vobRes.status}): ${vobText}`);
    let vobData; try { vobData = JSON.parse(vobText); } catch (_) { vobData = {}; }
    return { sid: vobData?.id || `vob_${Date.now()}` };
  }

  if (platform === 'voicelink') {
    const apiKey = credentials.apiKey || process.env.VOICELINK_API_KEY;
    if (!apiKey) throw new Error('VoiceLink credentials incomplete. API Key is required.');
    const vlRes = await fetch('https://api.voicelink.com/v1/calls', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
    });
    const vlText = await vlRes.text();
    if (!vlRes.ok) throw new Error(`VoiceLink API Error (${vlRes.status}): ${vlText}`);
    let vlData; try { vlData = JSON.parse(vlText); } catch (_) { vlData = {}; }
    return { sid: vlData?.id || `vl_${Date.now()}` };
  }

  if (platform === 'signalwire') {
    const projectId = credentials.projectId || process.env.SIGNALWIRE_PROJECT_ID;
    const apiToken = credentials.apiToken || process.env.SIGNALWIRE_API_TOKEN;
    const spaceUrl = credentials.spaceUrl || process.env.SIGNALWIRE_SPACE_URL;
    if (!projectId || !apiToken || !spaceUrl) throw new Error('SignalWire credentials incomplete. Project ID, API Token, and Space URL are required.');
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
    return { sid: swData?.sid || `sw_${Date.now()}` };
  }

  if (platform === 'retell') {
    const apiKey = credentials.apiKey || process.env.RETELL_API_KEY;
    if (!apiKey) throw new Error('Retell AI credentials incomplete. API Key is required.');
    const retRes = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_number: fromNumber, to_number: e164Number, override_agent_id: agent.vapiId || undefined })
    });
    const retText = await retRes.text();
    if (!retRes.ok) throw new Error(`Retell AI Error (${retRes.status}): ${retText}`);
    let retData; try { retData = JSON.parse(retText); } catch (_) { retData = {}; }
    return { sid: retData?.call_id || `ret_${Date.now()}` };
  }

  if (platform === 'custom') {
    const endpoint = credentials.sipEndpoint || credentials.webhookUrl;
    const apiKey = credentials.apiKey;
    if (!endpoint) throw new Error('Custom / SIP credentials incomplete. SIP Endpoint or Webhook URL is required.');
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
    return { sid: custData?.id || custData?.callSid || `cust_${Date.now()}` };
  }

  // Default Twilio platform
  let accountSid = (campaign?.twilioAccountSid ? decrypt(campaign.twilioAccountSid) : null)
    || (agent.twilioAccountSid ? decrypt(agent.twilioAccountSid) : null)
    || credentials.accountSid || credentials.accountSidKey || credentials.apiKey || process.env.TWILIO_ACCOUNT_SID;
  let authToken = (campaign?.twilioAuthToken ? decrypt(campaign.twilioAuthToken) : null)
    || (agent.twilioAuthToken ? decrypt(agent.twilioAuthToken) : null)
    || credentials.authToken || credentials.apiSecret || credentials.apiToken || process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) throw new Error(`Telephony credentials (Account SID / Auth Token) not configured for ${platform.toUpperCase()}`);

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

  return twilioRes.json();
}

async function initiateCall(agent, phoneNumber, userId, campaign) {
  const phoneClean = phoneNumber.replace(/[\s\-()]/g, '');
  const e164Number = phoneClean.startsWith('+') ? phoneClean : `+${phoneClean}`;

  if (agent.vapiId && agent.phoneNumberId) {
    const vapiCall = await createVapiOutboundCall({
      assistantId: agent.vapiId,
      phoneNumberId: agent.phoneNumberId,
      customer: { number: e164Number, name: 'Customer' },
    });

    if (vapiCall && vapiCall.id) {
      const call = await Call.create({
        agentId: agent._id,
        userId: userId,
        vapiCallId: vapiCall.id,
        callerNumber: e164Number,
        status: 'in-progress',
        startedAt: new Date(),
      });
      return call;
    }
  }

  // Twilio direct path
  const twilioCall = await placeTwilioCall(agent, e164Number, campaign);
  const call = await Call.create({
    agentId: agent._id,
    userId: userId,
    vapiCallId: twilioCall.sid,
    callerNumber: e164Number,
    status: 'in-progress',
    startedAt: new Date(),
  });
  return call;
}

const TWILIO_STATUS_MAP = {
  'completed': 'completed',
  'busy': 'failed',
  'no-answer': 'no-answer',
  'failed': 'failed',
  'canceled': 'failed',
};

export async function startCampaign(campaignId) {
  const campaign = await BulkCampaign.findById(campaignId).lean();
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status !== 'draft' && campaign.status !== 'paused') {
    throw new Error(`Campaign cannot be started (status: ${campaign.status})`);
  }

  const agent = await Agent.findById(campaign.agentId).lean();
  if (!agent) throw new Error('Agent not found');
  if (!agent.isActive) throw new Error('Agent is not active');

  const flag = { paused: false, cancelled: false };
  activeCampaigns.set(campaignId.toString(), flag);

  await BulkCampaign.findByIdAndUpdate(campaignId, {
    status: 'running',
    startedAt: new Date(),
  });

  // Process in background
  processCampaign(campaignId.toString(), agent, flag).catch(err => {
    log.error('bulk_campaign_error', { campaignId, error: err.message });
    activeCampaigns.delete(campaignId.toString());
  });
}

async function processCampaign(campaignId, agent, flag) {
  const BATCH_SIZE = 50;
  let skip = 0;
  let hasMore = true;

  while (hasMore && !flag.cancelled) {
    // Reload campaign to check pause/cancel and get current numbers
    const campaign = await BulkCampaign.findById(campaignId).lean();
    if (!campaign || campaign.status === 'cancelled') break;

    if (flag.paused) {
      await BulkCampaign.findByIdAndUpdate(campaignId, { status: 'paused' });
      activeCampaigns.delete(campaignId);
      log.info('bulk_campaign_paused', { campaignId });
      return;
    }

    const pendingNumbers = campaign.numbers.filter(n => n.status === 'pending');
    if (pendingNumbers.length === 0) break;

    const batch = pendingNumbers.slice(0, campaign.concurrency);

    // Process batch concurrently
    const promises = batch.map(async (entry) => {
      if (flag.cancelled || flag.paused) return;

      const numberIndex = campaign.numbers.findIndex(n => n._id.toString() === entry._id.toString());
      if (numberIndex === -1) return;

      // Update status to calling
      await BulkCampaign.updateOne(
        { _id: campaignId, ['numbers._id']: entry._id },
        { $set: { [`numbers.${numberIndex}.status`]: 'calling', [`numbers.${numberIndex}.startedAt`]: new Date() } }
      );

      try {
        const call = await initiateCall(agent, entry.phone, campaign.userId, campaign);

        await BulkCampaign.updateOne(
          { _id: campaignId, ['numbers._id']: entry._id },
          {
            $set: { [`numbers.${numberIndex}.status`]: 'completed', [`numbers.${numberIndex}.callId`]: call._id, [`numbers.${numberIndex}.endedAt`]: new Date() },
            $inc: { completedCount: 1 },
          }
        );
      } catch (err) {
        const status = err.message.includes('busy') ? 'busy'
          : err.message.includes('no-answer') ? 'no-answer'
          : 'failed';

        await BulkCampaign.updateOne(
          { _id: campaignId, ['numbers._id']: entry._id },
          {
            $set: { [`numbers.${numberIndex}.status`]: status, [`numbers.${numberIndex}.error`]: err.message, [`numbers.${numberIndex}.endedAt`]: new Date() },
            $inc: { failedCount: 1 },
          }
        );
      }
    });

    await Promise.all(promises);

    // Interruptible delay between batches (checks cancellation every 100ms)
    if (!flag.cancelled && !flag.paused && campaign.delayMs > 0) {
      let elapsed = 0;
      while (elapsed < campaign.delayMs) {
        if (flag.cancelled || flag.paused) break;
        const step = Math.min(100, campaign.delayMs - elapsed);
        await new Promise(r => setTimeout(r, step));
        elapsed += step;
      }
    }
  }

  // Mark campaign as completed
  if (!flag.cancelled && !flag.paused) {
    await BulkCampaign.findByIdAndUpdate(campaignId, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  activeCampaigns.delete(campaignId);
  log.info('bulk_campaign_completed', { campaignId });
}
