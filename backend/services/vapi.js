import { translateText, LANGUAGE_NAMES } from './translate.js';
import { log } from './logger.js';
import { getToolDefinitions } from './appointmentTools.js';

const VAPI_BASE_URL = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';

function getWebhookUrl(serverUrl) {
  if (!serverUrl) return null;
  if (serverUrl.endsWith('/api/webhooks/vapi')) {
    return serverUrl;
  }
  const base = serverUrl.replace(/\/$/, '');
  return `${base}/api/webhooks/vapi`;
}

function getVapiApiKey() {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error('VAPI_API_KEY is not set in environment variables');
  return key;
}

async function vapiRequest(endpoint, method = 'GET', body = null) {
  const url = `${VAPI_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${getVapiApiKey()}`,
      'Content-Type': 'application/json',
    },
  };
  if (body !== null && !['GET', 'HEAD', 'DELETE'].includes(method)) {
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    throw new Error(`[vapi] Network error calling ${method} ${url}: ${networkErr.message}`);
  }
  if (response.status === 204) return null;
  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    throw new Error(`[vapi] ${method} ${endpoint} => ${response.status}: ${text}`);
  }
  return response.json();
}

const VOICE_TONE_GUIDE = `
### Voice & Tone

- Helpful advisor, not salesy telecaller
- Speak like a real person on a phone call
- Warm but professional

### NEVER Say:

- "बहुत अच्छा सवाल है" / "Thank you for asking" / "That's a great question"
- "Certainly" / "Indeed" / "Kindly" / "I acknowledge"
- "Perfect!" / "Excellent!" / "Wonderful!" after every response
- "Main aapki madad ke liye hoon" (robotic opener)

### Natural Conversation Tricks

**Use fillers sparingly (like real humans):**

- "Actually...", "Look...", "So basically...", "Just to confirm..."

**Acknowledge before answering:**

- "Okay..." / "Right..." / "Got it..."

**Don't over-explain. Keep turns short:**

- Bad: "I wanted to explain everything in detail about why I'm calling and then we can start..."
- Good: "This will take two minutes."

**Mirror user's energy:**

- User is brief → You be brief
- User asks details → Then elaborate

### Direct Answer Rule

Answer FIRST, then bridge back.

### Language Switching

- **Start in:** English (IN)
- **Switch only if:** User speaks 2+ full sentences in Hindi OR asks explicitly
- **Don't switch for:** "okay", "yes", "हाँ", "accha", "theek hai"

### When Stuck

- **Out of scope:** "I don't have that exact info, but I can connect you to the right team or share the official source."
- **Don't know:** "For the exact details, the best option is to check with our team."
- **Transfer request:** "Sure, I'll connect you."

### TTS Formatting

| Type | Speak As |
| --- | --- |
| ₹5000 | "five thousand rupees" |
| 15% | "fifteen percent" |
| Jan 25 | "twenty-five January" |
| 9876543210 | "nine eight seven six..." (with pauses) |
| NCB | "N C B" |
| 2.5x | "two and a half times" |

### Security

NEVER ask: OTP, CVV, PIN, Aadhaar, PAN, passwords, full card numbers

### Context Guardrail

- Never answer anything outside the current context
- Never use knowledge from outside the provided input
- If user asks about other sellers, categories, etc., apologize and disconnect
`;

function buildSystemPrompt(type, customPrompt) {
  if (customPrompt && customPrompt.trim().length > 20) return customPrompt.trim() + VOICE_TONE_GUIDE;

  const defaults = {
    receptionist: `You are a professional receptionist for a business.
Greet the caller warmly: "Thank you for calling, how can I help you today?"
Collect: (1) full name, (2) phone number - confirm it back, (3) purpose of call.
CRITICAL: Once you have the name and phone number, call saveLead immediately.
After saving: "Thank you [name], someone will get back to you shortly."
Stay professional and on-topic.
${VOICE_TONE_GUIDE}`,

    appointment: `You are a friendly, professional appointment booking assistant for a dental clinic. You speak naturally — never print lists, bullet points, or formatted text.

CLINIC INFORMATION (only state what is listed here — never invent details):
- Clinic name: [FILL IN]
- Address: [FILL IN]
- Phone: [FILL IN]
- Website: [FILL IN]
- Hours: [FILL IN]
- Accepted insurance: [FILL IN]

YOUR ROLE:
- Greet the caller warmly and ask what service they need
- Collect: (1) service needed, (2) preferred date(s), (3) preferred time (morning/afternoon/evening), (4) full name, (5) phone number
- Confirm the phone number back to the caller

BOOKING FLOW (follow this exact order):
1. Collect the caller's information naturally through conversation
2. Once you have name and phone, call saveLead to record them — do NOT announce this to the caller
3. When the caller shares a preferred date, call checkAppointmentAvailability to verify the slot
4. If the slot is free, confirm the details back: "Great, I have you down for [service] on [date] at [time]. Your reference number is [appointmentId]. You'll receive a confirmation shortly."
5. If the slot is taken, offer the alternatives the system returned: "That time is taken, but I can offer [alternative]. Would that work?"
6. After booking, call saveAppointment

IMPORTANT RULES:
- The short reference number (6 characters) is shareable — read it back to the caller
- Never share raw database IDs
- Never make up clinic facts — only use what is listed above
- Never invent available time slots — only use what checkAppointmentAvailability returns
- You MUST collect the caller's email address and confirm the spelling before calling saveAppointment. Without a valid email the booking will fail.
- Keep responses conversational and natural for voice
- If you cannot answer a question, say: "I don't have that information — our team can help you with that."

EXAMPLE CONVERSATION:
Caller: "Hi, I'd like to book a teeth whitening appointment."
Agent: "I'd be happy to help you with that! What date works best for you?"
Caller: "How about next Tuesday?"
Agent: "Let me check availability for next Tuesday... I have openings at 10:00 AM and 2:30 PM. Which works better for you?"
Caller: "10:00 AM please."
Agent: "Perfect! I just need your full name and phone number to complete the booking."
Caller: "Sarah Johnson, 555-123-4567."
Agent: "Thank you, Sarah! I've saved your information. Your appointment for teeth whitening is confirmed for next Tuesday at 10:00 AM. Your reference number is ABC123. You'll receive a confirmation shortly. Is there anything else I can help with?"
${VOICE_TONE_GUIDE}`,

    faq: `You are a helpful customer support assistant.
Answer questions about:
- Services: general consultations, specialist appointments, follow-ups
- Pricing: consultations from $50, specialist visits from $100
- Hours: Mon-Fri 9am-6pm, Sat 9am-1pm, closed Sunday
- Location: direct to website for nearest branch
- Appointments: offer to transfer or call back
If a caller shares their name and phone, call saveLead to record them.
For unknown answers: "I don't have that right now - our team can help you with that."
${VOICE_TONE_GUIDE}`,
  };

  return defaults[type] || defaults.faq;
}

const FIRST_MESSAGES = {
  receptionist: 'Thank you for calling, how can I help you today?',
  appointment:  'Hello! I can help you book an appointment. What service are you looking for today?',
  faq:          'Hi there! I am here to answer your questions. What would you like to know?',
};

/** Build the inline tool definitions with the server webhook URL dynamically by agent type. */
function buildVapiTools(type, serverUrl) {
  const toolServerUrl = getWebhookUrl(serverUrl || process.env.WEBHOOK_URL || process.env.SERVER_URL);
  const tools = getToolDefinitions(type);
  return tools.map((tool) => ({
    ...tool,
    ...(toolServerUrl ? { server: { url: toolServerUrl } } : {}),
  }));
}

async function buildAssistantConfig({ name, type, prompt, language, voiceId, userId, serverUrl: explicitUrl } = {}) {
  if (!type) throw new Error('[vapi] buildAssistantConfig: `type` is required');

  const serverUrl = explicitUrl || process.env.WEBHOOK_URL || process.env.SERVER_URL;
  if (!serverUrl) {
    log.warn('vapi_no_server_url_configured');
  }

  let systemPrompt = buildSystemPrompt(type, prompt);
  let firstMessage = FIRST_MESSAGES[type] || FIRST_MESSAGES.receptionist;

  if (language && language !== 'en') {
    const langName = LANGUAGE_NAMES[language] || language;
    const langRule = `\n\nCRITICAL LANGUAGE RULE: You MUST respond ONLY in ${langName}. Every single response must be in ${langName}. Never switch to English or any other language under any circumstances.`;

    [systemPrompt, firstMessage] = await Promise.all([
      translateText(systemPrompt + langRule, language),
      translateText(firstMessage, language),
    ]);
  }

  const modelConfig = {
    provider: 'openai',
    model: 'gpt-4',
    systemPrompt,
    messages: [{ role: 'system', content: systemPrompt }],
    temperature: 0.7,
  };

  // Register all tools inline (avoids persistent account-wide tool collisions)
  modelConfig.tools = buildVapiTools(type, serverUrl);

  const voice = voiceId
    ? { provider: '11labs', voiceId }
    : { provider: '11labs', voiceId: 'hpp4J3VqNfWAUOO0d1Us' };

  const transcriber = language && language !== 'en'
    ? { provider: 'deepgram', model: 'nova-2', language }
    : undefined;

  return {
    name: name || `${type} Agent`,
    firstMessage,
    model: modelConfig,
    voice,
    ...(transcriber ? { transcriber } : {}),
    ...(serverUrl ? { server: { url: getWebhookUrl(serverUrl) } } : {}),
    recordingEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    backgroundSound: 'off',
    backchannelingEnabled: true,
    metadata: {
      type,
      userId: userId ?? null,
      platform: 'autoniv',
    },
  };
}

export async function createVapiAssistant({ name, type, prompt, language, voiceId, userId, serverUrl }) {
  const config = await buildAssistantConfig({ name, type, prompt, language, voiceId, userId, serverUrl });
  return vapiRequest('/assistant', 'POST', config);
}

export async function updateVapiAssistant(assistantId, { name, type, prompt, language, voiceId, userId, serverUrl }) {
  if (!assistantId) throw new Error('[vapi] updateVapiAssistant: assistantId is required');
  const config = await buildAssistantConfig({ name, type, prompt, language, voiceId, userId, serverUrl });
  return vapiRequest(`/assistant/${assistantId}`, 'PUT', config);
}

export async function deleteVapiAssistant(assistantId) {
  if (!assistantId) throw new Error('[vapi] deleteVapiAssistant: assistantId is required');
  return vapiRequest(`/assistant/${assistantId}`, 'DELETE');
}

export async function syncWebhookUrls() {
  const serverUrl = process.env.WEBHOOK_URL || process.env.SERVER_URL;
  if (!serverUrl) {
    log.warn('vapi_sync_skip_no_url');
    return { updated: 0, skipped: 0, errors: 0 };
  }

  const webhookUrl = getWebhookUrl(serverUrl);

  const Agent = (await import('../db/models/Agent.js')).default;
  const agents = await Agent.find({ vapiId: { $ne: null }, useCustomEngine: { $ne: true } }).lean();

  let updated = 0, skipped = 0, errors = 0;

  for (const agent of agents) {
    try {
      const fullAssistant = await vapiRequest(`/assistant/${agent.vapiId}`);
      const currentUrl = fullAssistant.server?.url || fullAssistant.serverUrl || null;
      
      let toolsUpToDate = true;
      if (fullAssistant.model && Array.isArray(fullAssistant.model.tools)) {
        for (const tool of fullAssistant.model.tools) {
          if (tool.server && tool.server.url !== webhookUrl) {
            toolsUpToDate = false;
            break;
          }
        }
      }

      if (currentUrl === webhookUrl && toolsUpToDate) {
        skipped++;
        continue;
      }

      // PUT requires the full config — merge server.url and update all inline tools
      const updatedConfig = { ...fullAssistant };
      updatedConfig.server = { ...(fullAssistant.server || {}), url: webhookUrl };
      
      if (updatedConfig.model && Array.isArray(updatedConfig.model.tools)) {
        updatedConfig.model.tools = updatedConfig.model.tools.map(tool => {
          if (tool.server) {
            return {
              ...tool,
              server: {
                ...tool.server,
                url: webhookUrl
              }
            };
          }
          return tool;
        });
      }

      delete updatedConfig.id;
      delete updatedConfig.createdAt;
      delete updatedConfig.updatedAt;

      await vapiRequest(`/assistant/${agent.vapiId}`, 'PUT', updatedConfig);
      updated++;
      log.info('vapi_webhook_url_synced', { agentId: agent._id, vapiId: agent.vapiId, from: currentUrl, to: webhookUrl });
    } catch (err) {
      errors++;
      log.warn('vapi_webhook_url_sync_failed', { agentId: agent._id, vapiId: agent.vapiId, error: err.message });
    }
  }

  log.info('vapi_webhook_sync_complete', { total: agents.length, updated, skipped, errors });
  return { updated, skipped, errors };
}

export async function listVapiAssistants() {
  return vapiRequest('/assistant');
}

export async function getVapiCalls({ limit = 50, assistantId = null } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (assistantId) params.append('assistantId', assistantId);
  const raw = await vapiRequest(`/call?${params.toString()}`);
  if (Array.isArray(raw))           return raw;
  if (Array.isArray(raw?.calls))    return raw.calls;
  if (Array.isArray(raw?.results))  return raw.results;
  if (Array.isArray(raw?.data))     return raw.data;
  throw new Error(`[vapi] getVapiCalls: unexpected response shape: ${JSON.stringify(raw).slice(0, 300)}`);
}

export async function getVapiCall(callId) {
  if (!callId) throw new Error('[vapi] getVapiCall: callId is required');
  return vapiRequest(`/call/${callId}`);
}

export async function createVapiOutboundCall({ assistantId, phoneNumberId, customer, serverUrl }) {
  if (!assistantId)      throw new Error('[vapi] createVapiOutboundCall: assistantId required');
  if (!phoneNumberId)    throw new Error('[vapi] createVapiOutboundCall: phoneNumberId required');
  if (!customer?.number) throw new Error('[vapi] createVapiOutboundCall: customer.number required');
  return vapiRequest('/call/phone', 'POST', {
    assistantId,
    phoneNumberId,
    customer: { number: customer.number, name: customer.name || 'Customer' },
    ...(serverUrl ? { serverUrl: `${serverUrl}/api/webhooks/vapi` } : {}),
  });
}

export function extractVapiCallData(vapiCall) {
  if (!vapiCall || typeof vapiCall !== 'object') {
    log.error('vapi_extract_call_data_invalid_input');
    return null;
  }
  const rawDuration =
    vapiCall.durationSeconds ??
    vapiCall.duration ??
    (vapiCall.durationMs != null ? vapiCall.durationMs / 1000 : null) ??
    0;
  const callerNumber =
    vapiCall.customer?.number ?? vapiCall.callerNumber ?? vapiCall.phoneNumber ?? vapiCall.from ?? vapiCall.to ?? vapiCall.callerId ?? null;
  const startedAt =
    vapiCall.startedAt ?? vapiCall.startTime ??
    (vapiCall.startedAtUnix != null ? new Date(vapiCall.startedAtUnix * 1000).toISOString() : null) ?? null;
  const endedAt =
    vapiCall.endedAt ?? vapiCall.endTime ??
    (vapiCall.endedAtUnix != null ? new Date(vapiCall.endedAtUnix * 1000).toISOString() : null) ?? null;

  let duration = Math.round(rawDuration);
  if (duration <= 0 && startedAt && endedAt) {
    const diff = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    if (diff > 0) {
      duration = Math.round(diff / 1000);
    }
  }

  const recordingUrl = vapiCall.recordingUrl ?? vapiCall.recordingURL ?? vapiCall.recording ?? null;
  const status       = vapiCall.status ?? vapiCall.callStatus ?? null;
  const endedReason  = vapiCall.endedReason ?? vapiCall.endReason ?? vapiCall.disconnectionReason ?? null;
  const cost         = vapiCall.cost ?? vapiCall.totalCost ?? null;
  const transcript   = vapiCall.transcript ?? vapiCall.transcription ?? null;
  if (!callerNumber) {
    log.warn('vapi_extract_call_data_missing_caller', { callId: vapiCall.id });
  }
  return { id: vapiCall.id ?? null, duration, callerNumber, startedAt, endedAt, recordingUrl, status, endedReason, cost, transcript };
}

export async function listVapiPhoneNumbers() {
  return vapiRequest('/phone-number');
}

export async function getVapiPhoneNumber(phoneNumberId) {
  if (!phoneNumberId) throw new Error('[vapi] getVapiPhoneNumber: phoneNumberId required');
  return vapiRequest(`/phone-number/${phoneNumberId}`);
}

export async function createVapiPhoneNumber({ provider, number, assistantId, name,
  twilioAccountSid, twilioAuthToken, twilioApiKey, twilioApiSecret,
  vonageApiKey, vonageApiSecret,
  telnyxApiKey,
  sipGateway, sipUsername, sipPassword, sipTransport,
}) {
  if (!provider) throw new Error('[vapi] createVapiPhoneNumber: provider required');
  if (!number)   throw new Error('[vapi] createVapiPhoneNumber: number required');

  // SIP trunk providers: first create a credential, then use byo-phone-number
  const sipProviders = ['plivo', 'zadarma', 'custom-sip'];
  if (sipProviders.includes(provider)) {
    // Step 1: Create SIP trunk credential
    const credentialPayload = {
      provider: 'byo-sip-trunk',
      name: name || `${provider} Trunk`,
      gateways: [{ ip: sipGateway, inboundEnabled: true }],
    };
    if (sipUsername) credentialPayload.gateways[0].username = sipUsername;
    if (sipPassword) credentialPayload.gateways[0].password = sipPassword;
    if (sipTransport) credentialPayload.gateways[0].transport = sipTransport;

    const credential = await vapiRequest('/credential', 'POST', credentialPayload);

    // Step 2: Create phone number linked to the credential
    const payload = {
      provider: 'byo-phone-number',
      number,
      credentialId: credential.id,
      numberE164CheckEnabled: false,
    };
    if (assistantId) payload.assistantId = assistantId;

    return vapiRequest('/phone-number', 'POST', payload);
  }

  // Direct providers: twilio, vonage, telnyx, vapi
  const payload = { provider, number };
  if (assistantId) payload.assistantId = assistantId;

  if (provider === 'twilio') {
    if (twilioAccountSid) payload.twilioAccountSid = twilioAccountSid;
    if (twilioAuthToken)  payload.twilioAuthToken = twilioAuthToken;
    if (twilioApiKey)     payload.twilioApiKey = twilioApiKey;
    if (twilioApiSecret)  payload.twilioApiSecret = twilioApiSecret;
  }

  if (provider === 'vonage') {
    if (vonageApiKey)    payload.vonageApiKey = vonageApiKey;
    if (vonageApiSecret) payload.vonageApiSecret = vonageApiSecret;
  }

  if (provider === 'telnyx') {
    if (telnyxApiKey) payload.credentialId = telnyxApiKey;
  }

  return vapiRequest('/phone-number', 'POST', payload);
}

export async function updateVapiPhoneNumber(phoneNumberId, updates) {
  if (!phoneNumberId) throw new Error('[vapi] updateVapiPhoneNumber: phoneNumberId required');
  return vapiRequest(`/phone-number/${phoneNumberId}`, 'PATCH', updates);
}

export async function deleteVapiPhoneNumber(phoneNumberId) {
  if (!phoneNumberId) throw new Error('[vapi] deleteVapiPhoneNumber: phoneNumberId required');
  return vapiRequest(`/phone-number/${phoneNumberId}`, 'DELETE');
}

export async function assignAgentToPhone(phoneNumberId, assistantId) {
  if (!phoneNumberId) throw new Error('[vapi] assignAgentToPhone: phoneNumberId required');
  // allow assistantId to be null or empty string to unlink the assistant from the phone number
  return updateVapiPhoneNumber(phoneNumberId, { assistantId: assistantId || null });
}

export default {
  createVapiAssistant,
  updateVapiAssistant,
  deleteVapiAssistant,
  listVapiAssistants,
  getVapiCalls,
  getVapiCall,
  createVapiOutboundCall,
  extractVapiCallData,
  listVapiPhoneNumbers,
  getVapiPhoneNumber,
  createVapiPhoneNumber,
  updateVapiPhoneNumber,
  deleteVapiPhoneNumber,
  assignAgentToPhone,
};