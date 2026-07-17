import mongoose from 'mongoose';
import BulkCampaign from '../db/models/BulkCampaign.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import User from '../db/models/User.js';
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
  const accountSid = (campaign?.twilioAccountSid ? decrypt(campaign.twilioAccountSid) : null)
    || (agent.twilioAccountSid ? decrypt(agent.twilioAccountSid) : null)
    || process.env.TWILIO_ACCOUNT_SID;
  const authToken = (campaign?.twilioAuthToken ? decrypt(campaign.twilioAuthToken) : null)
    || (agent.twilioAuthToken ? decrypt(agent.twilioAuthToken) : null)
    || process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error('Twilio credentials not configured');

  const fromNumber = campaign?.twilioPhoneNumber || agent.phoneNumber || process.env.TWILIO_FROM_NUMBER;
  if (!fromNumber) throw new Error('No outbound caller ID number');

  const baseWebhookUrl = process.env.WEBHOOK_URL || '';
  let twilioWebhookUrl;
  let twilioStatusCallbackUrl;
  if (baseWebhookUrl.endsWith('/api/webhooks/vapi')) {
    twilioWebhookUrl = baseWebhookUrl.replace('/vapi', '/incoming-call');
    twilioStatusCallbackUrl = baseWebhookUrl.replace('/vapi', '/twilio/status');
  } else {
    const base = baseWebhookUrl.replace(/\/$/, '');
    twilioWebhookUrl = `${base}/api/webhooks/incoming-call`;
    twilioStatusCallbackUrl = `${base}/api/webhooks/twilio/status`;
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
  const bodyParams = new URLSearchParams({
    To: e164Number,
    From: fromNumber,
    Url: twilioWebhookUrl,
    StatusCallback: twilioStatusCallbackUrl,
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

    // Delay between batches
    if (!flag.cancelled && !flag.paused && campaign.delayMs > 0) {
      await new Promise(r => setTimeout(r, campaign.delayMs));
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
