import { decrypt } from '../encryption.js';

const FETCH_TIMEOUT_MS = 15_000;
const fetchWithTimeout = (url, opts = {}) => fetch(url, { ...opts, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

export async function makeExotelCall({ fromNumber, e164Number, webhookUrl, statusCallbackUrl, credentials, agent, host }) {
  const sid = credentials.accountSid || credentials.subdomain || process.env.EXOTEL_ACCOUNT_SID;
  const apiKey = credentials.apiKey || process.env.EXOTEL_API_KEY;
  const apiToken = credentials.apiToken || credentials.authToken || process.env.EXOTEL_API_TOKEN;

  if (!sid || !apiKey || !apiToken) {
    throw new Error('Exotel credentials incomplete. Account SID, API Key, and API Token are required.');
  }

  let cleanFromNumber = fromNumber.replace(/\D/g, '');
  let cleanE164Number = e164Number.replace(/\D/g, '');
  if (cleanE164Number.length === 10) cleanE164Number = `0${cleanE164Number}`;
  if (cleanFromNumber.length === 10) cleanFromNumber = `0${cleanFromNumber}`;

  const base = (process.env.WEBHOOK_URL || `https://${host}`).replace(/\/api\/webhooks\/vapi$/, '').replace(/\/$/, '');
  const exoMlUrl = credentials.url || `${base}/api/webhooks/exotel/exoml`;
  const streamUrl = credentials.streamUrl || process.env.EXOTEL_STREAM_URL || `wss://${host}/exotel-stream`;

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
  const exoRes = await fetchWithTimeout(exotelUrl, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const exoText = await exoRes.text();
  if (!exoRes.ok) {
    throw new Error(`Exotel API Error (${exoRes.status}): ${exoText}`);
  }
  let exoData; try { exoData = JSON.parse(exoText); } catch (_) { exoData = {}; }
  return { callSid: exoData?.Call?.Sid || exoData?.sid || `exo_${Date.now()}` };
}

export async function makePlivoCall({ fromNumber, e164Number, webhookUrl, statusCallbackUrl, credentials }) {
  const authId = credentials.authId || credentials.accountSid || process.env.PLIVO_AUTH_ID;
  const authToken = credentials.authToken || credentials.apiToken || process.env.PLIVO_AUTH_TOKEN;

  if (!authId || !authToken) {
    throw new Error('Plivo credentials incomplete. Auth ID and Auth Token are required.');
  }

  const plivoUrl = `https://api.plivo.com/v1/Account/${authId}/Call/`;
  const authHeader = 'Basic ' + Buffer.from(`${authId}:${authToken}`).toString('base64');
  const plivoRes = await fetchWithTimeout(plivoUrl, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromNumber, to: e164Number, answer_url: webhookUrl, callback_url: statusCallbackUrl })
  });

  const plivoText = await plivoRes.text();
  if (!plivoRes.ok) {
    throw new Error(`Plivo API Error (${plivoRes.status}): ${plivoText}`);
  }
  let plivoData; try { plivoData = JSON.parse(plivoText); } catch (_) { plivoData = {}; }
  return { callSid: plivoData?.request_uuid || `plivo_${Date.now()}` };
}

export async function makeOzonetelCall({ fromNumber, e164Number, webhookUrl, credentials }) {
  const apiKey = credentials.apiKey || process.env.OZONETEL_API_KEY;
  const customerName = credentials.customerName || process.env.OZONETEL_CUSTOMER_NAME;
  if (!apiKey || !customerName) {
    throw new Error('Ozonetel credentials incomplete. API Key and Customer Name are required.');
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
  const ozRes = await fetchWithTimeout(`${ozUrl}?${params.toString()}`, { method: 'POST' });
  const ozText = await ozRes.text();
  if (!ozRes.ok) throw new Error(`Ozonetel API Error (${ozRes.status}): ${ozText}`);
  let ozData; try { ozData = JSON.parse(ozText); } catch (_) { ozData = {}; }
  return { callSid: ozData?.id || ozData?.callId || `oz_${Date.now()}` };
}

export async function makeMcubeCall({ fromNumber, e164Number, webhookUrl, credentials }) {
  const apiKey = credentials.apiKey || process.env.MCUBE_API_KEY;
  if (!apiKey) throw new Error('MCUBE credentials incomplete. API Key is required.');
  let cleanFromNumber = fromNumber.replace(/\D/g, '');
  let cleanE164Number = e164Number.replace(/\D/g, '');
  const mcRes = await fetchWithTimeout('https://mcube.vmpl.co.in/api/outbound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey, exphone: cleanFromNumber, callto: cleanE164Number, url: webhookUrl })
  });
  const mcText = await mcRes.text();
  if (!mcRes.ok) throw new Error(`MCUBE API Error (${mcRes.status}): ${mcText}`);
  let mcData; try { mcData = JSON.parse(mcText); } catch (_) { mcData = {}; }
  return { callSid: mcData?.callid || mcData?.id || `mc_${Date.now()}` };
}

export async function makeTataTeleCall({ fromNumber, e164Number, webhookUrl, credentials }) {
  const authKey = credentials.authKey || process.env.TATATELE_AUTH_KEY;
  if (!authKey) throw new Error('Tata Tele credentials incomplete. Auth Key is required.');
  const tataRes = await fetchWithTimeout('https://tatathr.in/api/v1/outbound', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
  });
  const tataText = await tataRes.text();
  if (!tataRes.ok) throw new Error(`Tata Tele API Error (${tataRes.status}): ${tataText}`);
  let tataData; try { tataData = JSON.parse(tataText); } catch (_) { tataData = {}; }
  return { callSid: tataData?.id || tataData?.call_id || `tata_${Date.now()}` };
}

export async function makeMaqsamCall({ fromNumber, e164Number, webhookUrl, credentials }) {
  const accessKey = credentials.accessKey || process.env.MAQSAM_ACCESS_KEY;
  const secretKey = credentials.secretKey || process.env.MAQSAM_SECRET_KEY;
  if (!accessKey || !secretKey) throw new Error('Maqsam credentials incomplete. Access Key and Secret Key are required.');
  const authHeader = 'Basic ' + Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
  const maqRes = await fetchWithTimeout('https://api.maqsam.com/v1/calls', {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
  });
  const maqText = await maqRes.text();
  if (!maqRes.ok) throw new Error(`Maqsam API Error (${maqRes.status}): ${maqText}`);
  let maqData; try { maqData = JSON.parse(maqText); } catch (_) { maqData = {}; }
  return { callSid: maqData?.id || `maq_${Date.now()}` };
}

export async function makeVobizCall({ fromNumber, e164Number, webhookUrl, credentials }) {
  const apiKey = credentials.apiKey || process.env.VOBIZ_API_KEY;
  if (!apiKey) throw new Error('Vobiz credentials incomplete. API Key is required.');
  const vobRes = await fetchWithTimeout('https://api.vobiz.io/v1/Calls', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromNumber, to: e164Number, answer_url: webhookUrl })
  });
  const vobText = await vobRes.text();
  if (!vobRes.ok) throw new Error(`Vobiz API Error (${vobRes.status}): ${vobText}`);
  let vobData; try { vobData = JSON.parse(vobText); } catch (_) { vobData = {}; }
  return { callSid: vobData?.id || `vob_${Date.now()}` };
}

export async function makeVoiceLinkCall({ fromNumber, e164Number, webhookUrl, credentials }) {
  const apiKey = credentials.apiKey || process.env.VOICELINK_API_KEY;
  if (!apiKey) throw new Error('VoiceLink credentials incomplete. API Key is required.');
  const vlRes = await fetchWithTimeout('https://api.voicelink.com/v1/calls', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromNumber, to: e164Number, url: webhookUrl })
  });
  const vlText = await vlRes.text();
  if (!vlRes.ok) throw new Error(`VoiceLink API Error (${vlRes.status}): ${vlText}`);
  let vlData; try { vlData = JSON.parse(vlText); } catch (_) { vlData = {}; }
  return { callSid: vlData?.id || `vl_${Date.now()}` };
}

export async function makeSignalWireCall({ fromNumber, e164Number, webhookUrl, statusCallbackUrl, credentials }) {
  const projectId = credentials.projectId || process.env.SIGNALWIRE_PROJECT_ID;
  const apiToken = credentials.apiToken || process.env.SIGNALWIRE_API_TOKEN;
  const spaceUrl = credentials.spaceUrl || process.env.SIGNALWIRE_SPACE_URL;
  if (!projectId || !apiToken || !spaceUrl) {
    throw new Error('SignalWire credentials incomplete. Project ID, API Token, and Space URL are required.');
  }
  const cleanSpaceUrl = spaceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const swUrl = `https://${cleanSpaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Calls.json`;
  const bodyParams = new URLSearchParams({ To: e164Number, From: fromNumber, Url: webhookUrl, StatusCallback: statusCallbackUrl });
  const basicAuth = Buffer.from(`${projectId}:${apiToken}`).toString('base64');
  const swRes = await fetchWithTimeout(swUrl, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams.toString()
  });
  const swText = await swRes.text();
  if (!swRes.ok) throw new Error(`SignalWire API Error (${swRes.status}): ${swText}`);
  let swData; try { swData = JSON.parse(swText); } catch (_) { swData = {}; }
  return { callSid: swData?.sid || `sw_${Date.now()}` };
}

export async function makeRetellCall({ fromNumber, e164Number, credentials, agent }) {
  const apiKey = credentials.apiKey || process.env.RETELL_API_KEY;
  if (!apiKey) throw new Error('Retell AI credentials incomplete. API Key is required.');
  const retRes = await fetchWithTimeout('https://api.retellai.com/v2/create-phone-call', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_number: fromNumber, to_number: e164Number, override_agent_id: agent.vapiId || undefined })
  });
  const retText = await retRes.text();
  if (!retRes.ok) throw new Error(`Retell AI Error (${retRes.status}): ${retText}`);
  let retData; try { retData = JSON.parse(retText); } catch (_) { retData = {}; }
  return { callSid: retData?.call_id || `ret_${Date.now()}` };
}

export async function makeCustomCall({ fromNumber, e164Number, webhookUrl, credentials }) {
  const endpoint = credentials.sipEndpoint || credentials.webhookUrl;
  const apiKey = credentials.apiKey;
  if (!endpoint) throw new Error('Custom / SIP credentials incomplete. SIP Endpoint or Webhook URL is required.');
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  const custRes = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ from: fromNumber, to: e164Number, webhookUrl })
  });
  const custText = await custRes.text();
  if (!custRes.ok) throw new Error(`Custom SIP API Error (${custRes.status}): ${custText}`);
  let custData; try { custData = JSON.parse(custText); } catch (_) { custData = {}; }
  return { callSid: custData?.id || custData?.callSid || `cust_${Date.now()}` };
}

export async function makeTwilioCall({ fromNumber, e164Number, webhookUrl, statusCallbackUrl, credentials, agent, platform }) {
  let accountSid = agent.twilioAccountSid ? decrypt(agent.twilioAccountSid) : (credentials.accountSid || credentials.accountSidKey || credentials.apiKey || process.env.TWILIO_ACCOUNT_SID);
  let authToken = agent.twilioAuthToken ? decrypt(agent.twilioAuthToken) : (credentials.authToken || credentials.apiSecret || credentials.apiToken || process.env.TWILIO_AUTH_TOKEN);

  if (!accountSid || !authToken) {
    throw new Error(`To make calls with ${platform.toUpperCase()}, please configure account credentials in Phone Numbers settings or environment variables.`);
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
  const twilioRes = await fetchWithTimeout(twilioUrl, {
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
  return { callSid: twilioCall.sid };
}

export const platformHandlers = {
  exotel: makeExotelCall,
  plivo: makePlivoCall,
  ozonetel: makeOzonetelCall,
  mcube: makeMcubeCall,
  tatatele: makeTataTeleCall,
  maqsam: makeMaqsamCall,
  vobiz: makeVobizCall,
  voicelink: makeVoiceLinkCall,
  signalwire: makeSignalWireCall,
  retell: makeRetellCall,
  custom: makeCustomCall,
  twilio: makeTwilioCall,
};
