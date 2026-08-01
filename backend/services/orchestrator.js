import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import mongoose from 'mongoose';

import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import User from '../db/models/User.js';
import PhoneNumber from '../db/models/PhoneNumber.js';
import { DEMO_AGENT } from '../routes/publicDemo.js';

import { synthesizeSpeech } from './tts.js';
import { LANGUAGE_NAMES } from './translate.js';
import { AudioRecorder } from './audioRecorder.js';
import { verifyMediaStreamToken } from './mediaStreamToken.js';
import { log } from './logger.js';
import {
  createDeepgramSTT,
  createLLMClient,
  generateCompletion,
  processStream,
  executeToolCalls,
  generateGreeting,
  translateIfNeeded,
  closeAndCleanup,
  extractCallerInfo as extractCallerInfoShared,
  injectCallerContext as injectCallerContextShared,
} from './orchestratorShared.js';

let sharedLLM = null;

function getSharedLLM() {
  if (!sharedLLM) sharedLLM = createLLMClient();
  return sharedLLM;
}

function buildSystemPrompt(type, customPrompt) {
  const completionRule = `\n\n### CRITICAL CALL COMPLETION RULE:\nOnce the lead or appointment is saved (after calling saveLead or saveAppointment), say: "Thank you for sharing your details! Our team will follow up with you shortly. Have a great day!" and immediately end the call / hang up. Do NOT ask any further questions once details are saved.`;

  if (customPrompt && customPrompt.trim().length > 20) return customPrompt.trim() + completionRule;

  const defaults = {
    receptionist: `You are a professional receptionist for a business.
Greet the caller warmly: "Thank you for calling, how can I help you today?"
Collect: (1) full name, (2) phone number - confirm it back, (3) purpose of call.
CRITICAL: Once you have the name and phone number, call saveLead immediately.
After saving: "Thank you [name], someone will get back to you shortly."
Stay professional and on-topic.${completionRule}`,

    appointment: `You are a friendly, professional appointment booking assistant. You speak naturally — never print lists, bullet points, or formatted text.

CLINIC INFORMATION (only state what is listed here — never invent details):
- Clinic name: [FILL IN]
- Address: [FILL IN]
- Phone: [FILL IN]
- Website: [FILL IN]
- Hours: [FILL IN]
- Accepted insurance: [FILL IN]

YOUR ROLE:
- Greet the caller warmly and ask what service they need
- Collect: (1) service needed, (2) preferred date(s), (3) preferred time (morning/afternoon/evening), (4) full name, (5) phone number, (6) email address
- Confirm the phone number and email back to the caller
- Email is required — you cannot complete a booking without a valid email address

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
- Keep responses conversational and natural for voice
- If you cannot answer a question, say: "I don't have that information — our team can help you with that."

EXAMPLE CONVERSATION:
Caller: "Hi, I'd like to book a teeth whitening appointment."
Agent: "I'd be happy to help you with that! What date works best for you?"
Caller: "How about next Tuesday?"
Agent: "Let me check availability for next Tuesday... I have openings at 10:00 AM and 2:30 PM. Which works better for you?"
Caller: "10:00 AM please."
Agent: "Perfect! I just need your full name, phone number, and email to complete the booking."
Caller: "Sarah Johnson, 555-123-4567, sarah.j@email.com."
Agent: "Thank you, Sarah! Let me confirm — teeth whitening next Tuesday at 10:00 AM, phone 555-123-4567, email sarah.j@email.com. Is that all correct?"
Caller: "Yes, that's right."
Agent: "Great, you're booked! Your reference number is ABC123. You'll receive a confirmation shortly. Is there anything else I can help with?"`,

    faq: `You are a helpful customer support assistant.
Answer questions about:
- Services: general consultations, specialist appointments, follow-ups
- Pricing: consultations from $50, specialist visits from $100
- Hours: Mon-Fri 9am-6pm, Sat 9am-1pm, closed Sunday
- Location: direct to website for nearest branch
- Appointments: offer to transfer or call back
If a caller shares their name and phone, call saveLead to record them.
For unknown answers: "I don't have that right now - our team can help you with that."`,
  };

  return defaults[type] || defaults.faq;
}

// Appended for every appointment agent (including custom-prompt ones) so the
// booking policy is enforced regardless of what the agent's own prompt says.
const APPOINTMENT_BOOKING_RULES = `\n\nBOOKING RULES:
1. Email is REQUIRED — always ask for and confirm it before booking.
2. Never invent the date or time. You may suggest slots, but only book what the caller confirms.
3. Before booking, read back service, date, time, name, phone, and email, and get a clear "yes".`;

// Hard cap on a single voice call. When it elapses we speak a wrap-up line and
// end the call, so the agent must collect every detail inside this window.
const MAX_CALL_DURATION_MS = 3.5 * 60 * 1000; // 3.5 minutes (210 seconds)

// Closing line spoken when the 3.5-minute limit is hit.
const TIME_LIMIT_CLOSING = 'I have everything I need for now. Thank you so much for your time — our team will get back to you shortly. Goodbye!';

// Appended to every agent's system prompt so it works efficiently within the cap.
const TIME_LIMIT_RULES = `\n\nTIME LIMIT: You have a strict maximum of 3.5 minutes for this entire call. Be warm but efficient — collect all essential details (full name, phone number, and the purpose or booking information) as early and quickly as possible. Do not make small talk or ask unnecessary questions. Call the required tools (like saveLead, saveAppointment) as soon as you have the information, without waiting.`;

// Appended to every agent's system prompt so the agent remembers caller details.
const CALLER_MEMORY_RULES = `\n\nCALLER INFORMATION MEMORY:
- If the caller has already provided their name or phone number earlier in this conversation, you MUST remember it and NEVER ask for it again.
- Before asking for any detail, check the conversation history to see if it was already shared.
- If the caller says something like "I already told you my name is [X]" or "I just gave you my number", acknowledge it and do NOT ask again.
- When you have all the required information from previous turns, proceed directly to the next step (e.g., saveLead, saveAppointment) without re-asking.`;

function interpolatePrompt(prompt, user) {
  if (!prompt || !user) return prompt;
  let result = prompt;

  const companyName = user.company || user.name || 'our business';
  const phone = user.phoneNumber || 'our office number';
  const email = user.email || '';
  const ownerName = user.name || '';

  result = result.replace(/\[COMPANY_NAME\]/g, companyName);
  result = result.replace(/\[COMPANY PHONE\]/g, phone);
  result = result.replace(/\[PHONE\]/g, phone);
  result = result.replace(/\[COMPANY EMAIL\]/g, email);
  result = result.replace(/\[EMAIL\]/g, email);
  result = result.replace(/\[OWNER NAME\]/g, ownerName);

  // Dynamically append the current date context so the agent always schedules in the future relative to today's date
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  result = result + `\n\nCRITICAL CONTEXT: Today's date is ${todayStr}. Any appointment date requested by the caller (like "tomorrow" or "next Monday") must be computed relative to today's date. Never check or book appointments for past dates.`;

  return result;
}

function safeString(value, maxLength, defaultValue = null) {
  if (value === undefined || value === null) return defaultValue;
  const str = String(value).trim();
  if (str.length === 0) return defaultValue;
  return str.slice(0, maxLength);
}

export function initOrchestrator(server) {
  // Bound frame size so a malformed/oversized frame can't exhaust memory.
  const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

  // Heartbeat: a half-open TCP connection stops delivering audio without
  // firing 'close', so the call would hang forever. Any inbound frame (Twilio
  // streams ~50/s) or a pong marks the socket alive; miss a full round -> drop.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch (_) { /* socket already gone */ }
    }
  }, 15000);
  if (typeof heartbeat.unref === 'function') heartbeat.unref();
  wss.on('close', () => clearInterval(heartbeat));

  wss.on('connection', async (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', () => { ws.isAlive = true; });

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const urlPath = parsedUrl.pathname;
    log.info('websocket_connection_request', { path: urlPath });

    if (urlPath === '/media-stream') {
      const agentId = parsedUrl.searchParams.get('agentId');
      const token = parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('amp;token');
      log.info('websocket_debug', { agentId, hasToken: Boolean(token), path: urlPath });
      // Defer verification to 'start' message if query params are stripped (standard for Twilio)
      if (agentId || token) {
        if (!verifyMediaStreamToken(agentId, token)) {
          log.warn('websocket_token_verification_failed', { agentId });
        }
      }
      handleTwilioStream(ws, agentId);
    } else if (urlPath === '/web-call') {
      handleWebCall(ws, req);
    } else if (urlPath === '/exotel-stream') {
      handleExotelStream(ws);
    } else {
      ws.close(4004, 'Not Found');
    }
  });

  log.info('orchestrator_initialized', { handlers: ['/media-stream', '/web-call', '/exotel-stream'] });
}

function handleTwilioStream(twilioWs, urlAgentId) {
  log.info('twilio_stream_connected');

  let streamSid = null;
  let callSid = null;
  let agentObj = null;
  let resolvedAgentId = urlAgentId;
  let conversationHistory = [];
  let fullTranscript = '';
  const callStartTime = new Date();
  let deepgramWs = null;
  let isInterrupted = false;
  let isProcessing = false;
  let toolAlreadyExecuted = { saveAppointment: false, saveLead: false };
  let callerInfo = { name: null, phone: null };
  let cleanedUp = false;
 
  let callTimeout = null;
  let timeLimitReached = false;
  
  let muteInputUntil = 0;
  const ECHO_TAIL_MS = 600;
  const recorder = new AudioRecorder(24000); // 24kHz mixed track

  const { groq, openaiClient, gemini } = getSharedLLM();
  const runCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    await closeAndCleanup({
      callSid, agentObj, callStartTime, fullTranscript, deepgramWs,
      pendingLeadData: toolAlreadyExecuted.pendingLeadData, recorder,
    });
  };

  const triggerInterruption = () => {
    if (!isProcessing || isInterrupted) return;
    isInterrupted = true;
    log.info('twilio_interruption', { message: 'Caller barged in — stopping agent playback.' });
    if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
      twilioWs.send(JSON.stringify({ event: 'clear', streamSid }));
    }
  };

  const extractCallerInfo = (text) => extractCallerInfoShared(text, callerInfo);

  const injectCallerContext = () => injectCallerContextShared(conversationHistory, callerInfo);

  const handleUserUtterance = async (userInputText) => {
    isInterrupted = false;
    extractCallerInfo(userInputText);
    conversationHistory.push({ role: 'user', content: userInputText });
    injectCallerContext();
    executeCompletionFlow();
  };

  const processSentenceForPlay = async (sentence) => {
    if (isInterrupted) return;
    try {
      const base64Audio = await synthesizeSpeech(sentence, true, agentObj?.language || 'en', agentObj?.voiceId);
      if (base64Audio && !isInterrupted && twilioWs.readyState === WebSocket.OPEN && streamSid) {
        const agentAudio = Buffer.from(base64Audio, 'base64');
        recorder.writeMulaw8k(agentAudio, Date.now());
        twilioWs.send(JSON.stringify({ event: 'media', streamSid, media: { payload: base64Audio } }));
        const playbackMs = agentAudio.length / 8;
        muteInputUntil = Math.max(muteInputUntil, Date.now() + playbackMs + ECHO_TAIL_MS);
      }
    } catch (err) {
      log.error('tts_synthesis_failed', { error: err.message });
    }
  };

  const executeCompletionFlow = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const { stream } = await generateCompletion({
        groq, openaiClient, gemini, conversationHistory,
        agentType: agentObj?.type, logPrefix: 'Twilio LLM',
        toolState: toolAlreadyExecuted,
        agentObj,
      });

      const { fullResponseText, toolCalls, interrupted } = await processStream({
        stream, isInterrupted, onSentence: processSentenceForPlay,
      });

      if (interrupted) return;

      if (fullResponseText || toolCalls.length > 0) {
        const assistantMsg = { role: 'assistant' };
        if (fullResponseText) {
          assistantMsg.content = fullResponseText;
          fullTranscript += `Agent: ${fullResponseText}\n`;
        } else {
          assistantMsg.content = null;
        }
        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: tc.arguments
            }
          }));
        }
        conversationHistory.push(assistantMsg);
      }

      if (toolCalls.length > 0 && !isInterrupted) {
        await executeToolCalls({
          toolCalls, agentObj, toolAlreadyExecuted,
          conversationHistory, logPrefix: 'Twilio Tool',
          callId: callSid,
        });
        isProcessing = false;
        await executeCompletionFlow();
        return;
      }
    } catch (err) {
      log.error('twilio_completion_flow_error', { error: err.message });
      if (!isInterrupted) {
        try {
          await processSentenceForPlay('Sorry, I missed that. Could you say it again?');
        } catch (_) { /* best-effort recovery */ }
      }
    } finally {
      isProcessing = false;
    }
  };

  const handleStartCall = async () => {
    try {
      if (resolvedAgentId && mongoose.Types.ObjectId.isValid(resolvedAgentId)) {
        agentObj = await Agent.findById(resolvedAgentId).lean();
        if (agentObj) {
          log.info('database_agent_loaded', { method: 'direct', name: agentObj.name });
        }
      }

      if (!agentObj && callSid) {
        const callObj = await Call.findOne({ vapiCallId: callSid }).populate('agentId').lean();
        if (callObj?.agentId) {
          agentObj = callObj.agentId;
          log.info('database_agent_loaded', { method: 'call_record_fallback', name: agentObj.name });
        }
      }
    } catch (dbErr) {
      log.error('database_resolution_error', { error: dbErr.message });
    }

    try {
      deepgramWs = await createDeepgramSTT({
        agentObj, encoding: 'mulaw', sampleRate: 8000, logPrefix: 'Deepgram STT',
        onTranscript: (text) => { fullTranscript += `Caller: ${text}\n`; handleUserUtterance(text); },
        onInterruption: triggerInterruption,
      });
    } catch (sttErr) {
      log.error('deepgram_stt_init_failed', { error: sttErr.message });
    }

    const ownerUser = agentObj ? await User.findById(agentObj.userId).lean() : null;
    let systemInstructions = buildSystemPrompt(agentObj?.type || 'receptionist', agentObj?.prompt);
    if (ownerUser) systemInstructions = interpolatePrompt(systemInstructions, ownerUser);
    if ((agentObj?.type || 'receptionist') === 'appointment') systemInstructions += APPOINTMENT_BOOKING_RULES;
    systemInstructions += TIME_LIMIT_RULES;
    systemInstructions += CALLER_MEMORY_RULES;

    const agentLangName = LANGUAGE_NAMES[agentObj?.language || 'en'] || 'English';
    systemInstructions += `\n\nMULTILINGUAL & HUMAN SPEECH RULES:
1. You must respond in the same language that the user is speaking. If the user speaks or switches to another language (such as English, Hindi, Spanish, French, etc.), you MUST switch and reply in that language directly. Your default/starting language is ${agentLangName}.
2. Speak exactly like a natural, warm, and friendly human. Never sound robotic, and never output lists, tables, or bullet points.
3. When speaking in Hindi, use natural, conversational Hindi phrasing. Never write dates or times using spelled-out English words (e.g., do NOT say "twenty sixth july" or "four baje"). Instead, write them in standard digits or native Hindi words (e.g., say "26 जुलाई 2026" or "छब्बीस जुलाई" and "4 बजे" or "चार बजे"). Keep numbers and dates in standard format so the voice engine pronounces them naturally like a human.`;

    let greetingText = await generateGreeting({ groq, openaiClient, gemini, systemInstructions, agentType: agentObj?.type || 'receptionist', agentObj });
    const result = await translateIfNeeded(systemInstructions, greetingText, agentObj?.language || 'en');
    systemInstructions = result.systemInstructions;
    greetingText = result.greetingText;

    conversationHistory.push({ role: 'system', content: systemInstructions });
    log.info('twilio_greeting', { greeting: greetingText });
    conversationHistory.push({ role: 'assistant', content: greetingText });
    fullTranscript += `Agent: ${greetingText}\n`;
    // Mark the agent as speaking so the caller can barge in over the greeting.
    isProcessing = true;
    try {
      await processSentenceForPlay(greetingText);
    } finally {
      isProcessing = false;
    }

    // Arm the hard 2-minute cap. On expiry, wait for any in-flight turn to
    // finish, speak the closing line, then end the call.
    callTimeout = setTimeout(endCallOnTimeLimit, MAX_CALL_DURATION_MS);
  };

  // Ends the call once the 2-minute cap is reached: let any in-flight response
  // settle, play a graceful closing line, then close the stream (which triggers
  // runCleanup for billing + recording).
  const endCallOnTimeLimit = async () => {
    if (timeLimitReached || cleanedUp) return;
    timeLimitReached = true;
    log.info('twilio_call_time_limit_reached');
    // Cut off any current agent turn so the closing line plays immediately.
    isInterrupted = true;
    if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
      try { twilioWs.send(JSON.stringify({ event: 'clear', streamSid })); } catch (_) { /* gone */ }
    }
    isInterrupted = false;
    try {
      await processSentenceForPlay(TIME_LIMIT_CLOSING);
    } catch (_) { /* best-effort */ }
    // Give Twilio a moment to play out the closing audio before hanging up.
    setTimeout(() => {
      try { if (twilioWs.readyState === WebSocket.OPEN) twilioWs.close(1000, 'Time limit reached'); } catch (_) { /* gone */ }
      runCleanup();
    }, 4000);
  };

  twilioWs.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      switch (data.event) {
        case 'start':
          streamSid = data.start.streamSid;
          callSid = data.start.callSid;

          if (!resolvedAgentId) {
            const customParams = data.start.customParameters || {};
            resolvedAgentId = customParams.agentId;
            const token = customParams.token;
            log.info('twilio_ws_verifying_deferred_params', { agentId: resolvedAgentId });
            if (!verifyMediaStreamToken(resolvedAgentId, token)) {
              log.warn('websocket_token_warning_start_event');
            }
          }

          log.info('twilio_stream_started', { streamSid, callSid, agentId: resolvedAgentId });
          await handleStartCall();
          break;
        case 'media': {
          const inboundMulaw = Buffer.from(data.media.payload, 'base64');
       
          let recordTs;
          if (Number.isFinite(mediaTs)) {
            if (mediaEpoch === null) mediaEpoch = Date.now() - mediaTs;
            recordTs = mediaEpoch + mediaTs;
          } else {
            recordTs = Date.now();
          }
          recorder.writeMulaw8k(inboundMulaw, recordTs);
          if (Date.now() < muteInputUntil) break;
          if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.send(inboundMulaw);
          }
          break;
        }
        case 'stop':
          log.info('twilio_stream_stopped');
          await runCleanup();
          break;
      }
    } catch (err) {
      log.error('twilio_message_error', { error: err.message });
    }
  });

  twilioWs.on('close', async () => {
    log.info('twilio_connection_closed');
    await runCleanup();
  });
}

// ==========================================
// 3. Exotel Voicebot Stream Handler
// ==========================================
async function handleExotelStream(exotelWs) {
  log.info('exotel_stream_connected');

  let streamSid = null;
  let callSid = null;
  let agentObj = null;
  let exotelToNumber = null; // The Exotel number the caller dialed
  let conversationHistory = [];
  let fullTranscript = '';
  const callStartTime = new Date();
  let deepgramWs = null;
  let isInterrupted = false;
  let isProcessing = false;
  let toolAlreadyExecuted = { saveAppointment: false, saveLead: false };
  let callerInfo = { name: null, phone: null };
  let cleanedUp = false;
  let callTimeout = null;
  let timeLimitReached = false;
  // Exotel Voicebot Applet sends raw/slin 16-bit PCM at 8kHz (not mulaw).
  // Deepgram STT and outbound TTS must both use linear16/8kHz.
  const EXOTEL_SAMPLE_RATE = 8000;
  const recorder = new AudioRecorder(EXOTEL_SAMPLE_RATE);
  let muteInputUntil = 0;
  const ECHO_TAIL_MS = 600;

  const { groq, openaiClient, gemini } = getSharedLLM();

  const runCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    await closeAndCleanup({
      callSid, agentObj, callStartTime, fullTranscript, deepgramWs,
      pendingLeadData: toolAlreadyExecuted.pendingLeadData, recorder,
    });
  };

  const endCallOnTimeLimit = async () => {
    if (timeLimitReached || cleanedUp) return;
    timeLimitReached = true;
    log.info('exotel_call_time_limit_reached');
    isInterrupted = true;
    if (exotelWs.readyState === WebSocket.OPEN && streamSid) {
      try { exotelWs.send(JSON.stringify({ event: 'clear', stream_sid: streamSid })); } catch (_) { /* gone */ }
    }
    isInterrupted = false;
    if (exotelWs.readyState === WebSocket.OPEN) {
      try { exotelWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: TIME_LIMIT_CLOSING })); } catch (_) { /* gone */ }
    }
    try {
      await processSentenceForPlay(TIME_LIMIT_CLOSING);
    } catch (_) { /* best-effort */ }
    setTimeout(() => {
      try { if (exotelWs.readyState === WebSocket.OPEN) exotelWs.close(1000, 'Time limit reached'); } catch (_) { /* gone */ }
      runCleanup();
    }, 4000);
  };

  const triggerInterruption = () => {
    if (!isProcessing || isInterrupted) return;
    isInterrupted = true;
    log.info('exotel_interruption', { message: 'Caller barged in.' });
    if (exotelWs.readyState === WebSocket.OPEN && streamSid) {
      exotelWs.send(JSON.stringify({ event: 'clear', stream_sid: streamSid }));
    }
  };

  const extractCallerInfo = (text) => extractCallerInfoShared(text, callerInfo);

  const injectCallerContext = () => injectCallerContextShared(conversationHistory, callerInfo);

  const handleUserUtterance = async (userInputText) => {
    isInterrupted = false;
    extractCallerInfo(userInputText);
    conversationHistory.push({ role: 'user', content: userInputText });
    injectCallerContext();
    executeCompletionFlow();
  };

  const processSentenceForPlay = async (sentence) => {
    if (isInterrupted) return;
    try {
      // Exotel Voicebot Applet expects raw/slin 16-bit PCM at 8kHz.
      const base64Audio = await synthesizeSpeech(sentence, { encoding: 'linear16', sampleRate: EXOTEL_SAMPLE_RATE }, agentObj.language || 'en', agentObj.voiceId);
      if (base64Audio && !isInterrupted) {
        const agentAudioBuffer = Buffer.from(base64Audio, 'base64');
        recorder.writeAudio(agentAudioBuffer, Date.now(), EXOTEL_SAMPLE_RATE);
        if (exotelWs.readyState === WebSocket.OPEN && streamSid) {
          exotelWs.send(JSON.stringify({
            event: 'media',
            stream_sid: streamSid,
            media: { payload: base64Audio },
          }));
          // Send mark so Exotel notifies us when playback completes (for echo suppression).
          exotelWs.send(JSON.stringify({
            event: 'mark',
            stream_sid: streamSid,
            mark: { name: `audio-${Date.now()}` },
          }));
        }
      }
    } catch (err) {
      log.error('tts_synthesis_failed', { error: err.message });
    }
  };

  const executeCompletionFlow = async () => {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const { stream } = await generateCompletion({
        groq, openaiClient, gemini, conversationHistory,
        agentType: agentObj?.type, logPrefix: 'Exotel LLM',
        toolState: toolAlreadyExecuted, agentObj,
      });
      const { fullResponseText, toolCalls, interrupted } = await processStream({
        stream, isInterrupted, onSentence: processSentenceForPlay,
      });
      if (interrupted) return;
      if (fullResponseText || toolCalls.length > 0) {
        const assistantMsg = { role: 'assistant' };
        if (fullResponseText) {
          assistantMsg.content = fullResponseText;
          fullTranscript += `Agent: ${fullResponseText}\n`;
          if (exotelWs.readyState === WebSocket.OPEN) {
            exotelWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: fullResponseText }));
          }
        } else {
          assistantMsg.content = null;
        }
        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls.map(tc => ({
            id: tc.id, type: 'function',
            function: { name: tc.name, arguments: tc.arguments },
          }));
        }
        conversationHistory.push(assistantMsg);
      }
      if (toolCalls.length > 0 && !isInterrupted) {
        await executeToolCalls({
          toolCalls, agentObj, toolAlreadyExecuted,
          conversationHistory, logPrefix: 'Exotel Tool', callId: callSid,
        });
        isProcessing = false;
        await executeCompletionFlow();
        return;
      }
    } catch (err) {
      log.error('exotel_completions_error', { error: err.message });
      if (!isInterrupted) {
        try { await processSentenceForPlay('Sorry, I missed that. Could you say it again?'); } catch (_) { /* best-effort */ }
      }
    } finally {
      isProcessing = false;
    }
  };

  const handleStartCall = async () => {
    // Load agent from DB — look up by the Exotel ExoPhone number (the `to` number)
    try {
      if (exotelToNumber) {
        const rawDigits = exotelToNumber.replace(/\D/g, '');
        const last10 = rawDigits.slice(-10);
        const phoneNumber = await PhoneNumber.findOne({
          platform: 'exotel',
          $or: [
            { phoneNumber: exotelToNumber },
            { phoneNumber: { $regex: last10 + '$' } }
          ],
          status: 'active',
        }).populate('assignedToAgent').lean();
        
        if (phoneNumber?.assignedToAgent) {
          agentObj = phoneNumber.assignedToAgent;
          // Store Exotel credentials for potential outbound API calls
          agentObj._exotelCredentials = phoneNumber.credentials || {};
          log.info('database_agent_loaded', { method: 'exotel_phone_number', name: agentObj.name });
        }
      }
      // Fallback 1: try callSid if it looks like a MongoDB ObjectId
      if (!agentObj && callSid && mongoose.Types.ObjectId.isValid(callSid)) {
        const callObj = await Call.findOne({ vapiCallId: callSid }).populate('agentId').lean();
        if (callObj?.agentId) {
          agentObj = callObj.agentId;
          log.info('database_agent_loaded', { method: 'exotel_call_record', name: agentObj.name });
        }
      }

      // Fallback 2: find any active Exotel PhoneNumber assigned to an agent
      if (!agentObj) {
        const fallbackPhone = await PhoneNumber.findOne({
          platform: 'exotel',
          status: 'active',
          assignedToAgent: { $exists: true, $ne: null }
        }).populate('assignedToAgent').lean();

        if (fallbackPhone?.assignedToAgent) {
          agentObj = fallbackPhone.assignedToAgent;
          log.info('database_agent_loaded', { method: 'exotel_fallback', name: agentObj.name });
        }
      }

      // Fallback 3: find the latest active Agent in DB
      if (!agentObj) {
        agentObj = await Agent.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean();
        if (agentObj) {
          log.info('database_agent_loaded', { method: 'exotel_default_active', name: agentObj.name });
        }
      }
    } catch (dbErr) {
      log.error('exotel_agent_resolution_error', { error: dbErr.message });
    }

    if (!agentObj) {
      log.error('exotel_no_agent_found');
      exotelWs.close(4001, 'Agent not found');
      return;
    }

    // Initialize Deepgram STT after agent is loaded
    // Exotel Voicebot Applet sends raw/slin 16-bit PCM (linear16) at 8kHz.
    try {
      deepgramWs = await createDeepgramSTT({
        agentObj, encoding: 'linear16', sampleRate: EXOTEL_SAMPLE_RATE,
        logPrefix: 'Deepgram Exotel STT',
        onTranscript: (text) => {
          fullTranscript += `Caller: ${text}\n`;
          if (exotelWs.readyState === WebSocket.OPEN) {
            exotelWs.send(JSON.stringify({ event: 'transcript', role: 'caller', text }));
          }
          handleUserUtterance(text);
        },
        onInterruption: triggerInterruption,
      });
    } catch (sttErr) {
      log.error('deepgram_stt_init_failed', { error: sttErr.message });
    }

    const ownerUser = await User.findById(agentObj.userId).lean();
    let systemInstructions = buildSystemPrompt(agentObj.type, agentObj.prompt);
    if (ownerUser) systemInstructions = interpolatePrompt(systemInstructions, ownerUser);
    if (agentObj.type === 'appointment') systemInstructions += APPOINTMENT_BOOKING_RULES;
    systemInstructions += TIME_LIMIT_RULES;
    systemInstructions += CALLER_MEMORY_RULES;

    const agentLangName = LANGUAGE_NAMES[agentObj?.language || 'en'] || 'English';
    systemInstructions += `\n\nMULTILINGUAL & HUMAN SPEECH RULES:
1. You must respond in the same language that the user is speaking. If the user speaks or switches to another language (such as English, Hindi, Spanish, French, etc.), you MUST switch and reply in that language directly. Your default/starting language is ${agentLangName}.
2. Speak exactly like a natural, warm, and friendly human. Never sound robotic, and never output lists, tables, or bullet points.
3. When speaking in Hindi, use natural, conversational Hindi phrasing. Never write dates or times using spelled-out English words (e.g., do NOT say "twenty sixth july" or "four baje"). Instead, write them in standard digits or native Hindi words (e.g., say "26 जुलाई 2026" or "छब्बीस जुलाई" and "4 बजे" or "चार बजे"). Keep numbers and dates in standard format so the voice engine pronounces them naturally like a human.`;

    let greetingText = await generateGreeting({ groq, openaiClient, gemini, systemInstructions, agentType: agentObj.type, agentObj });
    const result = await translateIfNeeded(systemInstructions, greetingText, agentObj.language || 'en');
    systemInstructions = result.systemInstructions;
    greetingText = result.greetingText;

    conversationHistory.push({ role: 'system', content: systemInstructions });
    log.info('exotel_greeting', { greeting: greetingText });
    conversationHistory.push({ role: 'assistant', content: greetingText });
    fullTranscript += `Agent: ${greetingText}\n`;

    if (exotelWs.readyState === WebSocket.OPEN) {
      exotelWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: greetingText }));
    }
    isProcessing = true;
    try {
      await processSentenceForPlay(greetingText);
    } finally {
      isProcessing = false;
    }

    callTimeout = setTimeout(endCallOnTimeLimit, MAX_CALL_DURATION_MS);
  };

  // ---------- Exotel event handling ----------
  exotelWs.on('message', (raw, isBinary) => {
    try {
      if (isBinary || Buffer.isBuffer(raw) || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
        // Raw binary audio (mu-law) — forward to Deepgram.
        const audioBuffer = Buffer.from(raw);
        recorder.writeAudio(audioBuffer, Date.now(), EXOTEL_SAMPLE_RATE);
        if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
          deepgramWs.send(audioBuffer);
        }
        return;
      }

      const data = JSON.parse(raw.toString());

      switch (data.event) {
        case 'connected':
          log.info('exotel_stream_connected');
          break;

        case 'start':
          // Exotel sends stream_sid at top level AND inside start object.
          streamSid = data.stream_sid || data.start?.stream_sid || null;
          exotelToNumber = data.start?.to || null;
          callSid = data.start?.call_sid || 'exotel-call';
          log.info('exotel_stream_started', { streamSid, callSid, from: data.start?.from, to: exotelToNumber });
          handleStartCall();
          break;

        case 'media': {
          // Exotel sends media events (not "audio") with timestamp as string.
          if (data.media?.payload) {
            const inboundPcm = Buffer.from(data.media.payload, 'base64');
            recorder.writeAudio(inboundPcm, Date.now(), EXOTEL_SAMPLE_RATE);
            if (Date.now() < muteInputUntil) break;
            if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
              deepgramWs.send(inboundPcm);
            }
          }
          break;
        }

        case 'dtmf':
          // DTMF digits from caller — can be used for menu navigation if needed.
          log.info('exotel_dtmf', { digit: data.dtmf?.digit });
          break;

        case 'mark':
          // Notification that previously sent audio finished playing.
          log.info('exotel_mark_received', { name: data.mark?.name });
          break;

        case 'stop':
          log.info('exotel_stream_stopped', { reason: data.stop?.reason || 'unknown' });
          exotelWs.close(1000, 'Exotel stream ended');
          break;

        default:
          log.info('exotel_unknown_event', { event: data.event });
      }
    } catch (err) {
      log.error('exotel_ws_parse_error', { error: err.message });
    }
  });

  exotelWs.on('close', async () => {
    log.info('exotel_connection_closed');
    await runCleanup();
  });
}

// ==========================================
// 4. Web Call Connection Handler
// ==========================================
async function handleWebCall(clientWs, req) {
  log.info('web_call_connection_request');

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const agentId = parsedUrl.searchParams.get('agentId');

  const isDemo = agentId === 'demo';

  if (!agentId || (!isDemo && !mongoose.Types.ObjectId.isValid(agentId))) {
    clientWs.close(4000, 'agentId parameter is required');
    return;
  }

  let agentObj = null;
  let callSid = '';
  let conversationHistory = [];
  let fullTranscript = '';
  const callStartTime = new Date();
  let deepgramWs = null;
  let isInterrupted = false;
  let chunkCount = 0;
  let isProcessing = false;
  let toolAlreadyExecuted = { saveAppointment: false, saveLead: false };
  let callerInfo = { name: null, phone: null };
  const recorder = new AudioRecorder(24000);
  // Hard 2-minute call cap (see MAX_CALL_DURATION_MS).
  let callTimeout = null;
  let timeLimitReached = false;
  let cleanedUp = false;

  const { groq, openaiClient, gemini } = getSharedLLM();

  try {
    if (isDemo) {
      agentObj = {
        _id: 'demo',
        name: 'Autoniv AI Assistant',
        type: 'receptionist',
        language: 'en',
        voiceId: 'FGY2WhTYpPnrIDTdsKH5',
        prompt: DEMO_AGENT.prompt,
      };
    } else {
      agentObj = await Agent.findById(agentId);
      if (!agentObj) { clientWs.close(4001, 'Agent not found'); return; }
    }

    let callUserId = null;
    if (isDemo) {
      const fallbackUser = await User.findOne({ role: 'admin' }).lean();
      callUserId = fallbackUser ? fallbackUser._id : new mongoose.Types.ObjectId();
    } else {
      callUserId = agentObj.userId;
    }

    const callRecord = new Call({
      agentId: isDemo ? null : agentObj._id,
      userId: callUserId,
      callerNumber: 'Web Caller',
      status: 'in-progress',
      startedAt: new Date(),
    });
    callSid = callRecord._id.toString();
    callRecord.vapiCallId = callSid;
    await callRecord.save();
    log.info('web_call_record_initialized', { callSid });
  } catch (err) {
    log.error('web_call_setup_error', { error: err.message });
    clientWs.close(4999, 'Database setup error');
    return;
  }

  const triggerInterruption = () => {
    // Only a barge-in matters: ignore interim transcripts unless the agent is
    // actively responding, and only fire once per interruption. This stops
    // routine listening from spuriously cutting the agent off (or spamming
    // 'clear' events) on every word-by-word interim result.
    if (!isProcessing || isInterrupted) return;
    isInterrupted = true;
    log.info('twilio_interruption', { message: 'Caller barged in — stopping agent playback.' });
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ event: 'clear' }));
    }
  };

  const extractCallerInfo = (text) => extractCallerInfoShared(text, callerInfo);

  const injectCallerContext = () => injectCallerContextShared(conversationHistory, callerInfo);

  const handleUserUtterance = async (userInputText) => {
    isInterrupted = false;
    extractCallerInfo(userInputText);
    conversationHistory.push({ role: 'user', content: userInputText });
    injectCallerContext();
    executeCompletionFlow();
  };

  const processSentenceForPlay = async (sentence) => {
    if (isInterrupted) return;
    try {
      const base64Audio = await synthesizeSpeech(sentence, false, agentObj.language || 'en', agentObj.voiceId);
      if (base64Audio && !isInterrupted) {
        const agentAudioBuffer = Buffer.from(base64Audio, 'base64');
        recorder.writeAudio(agentAudioBuffer, Date.now(), 24000);

        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ event: 'audio', payload: base64Audio }));
        }
      }
    } catch (err) {
      log.error('tts_synthesis_failed', { error: err.message });
    }
  };

  const executeCompletionFlow = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const { stream } = await generateCompletion({
        groq, openaiClient, gemini, conversationHistory,
        agentType: agentObj?.type, logPrefix: 'Web LLM',
        toolState: toolAlreadyExecuted,
        agentObj,
      });

      const { fullResponseText, toolCalls, interrupted } = await processStream({
        stream, isInterrupted, onSentence: processSentenceForPlay,
      });

      if (interrupted) return;

      if (fullResponseText || toolCalls.length > 0) {
        const assistantMsg = { role: 'assistant' };
        if (fullResponseText) {
          assistantMsg.content = fullResponseText;
          fullTranscript += `Agent: ${fullResponseText}\n`;
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: fullResponseText }));
          }
        } else {
          assistantMsg.content = null;
        }
        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: tc.arguments
            }
          }));
        }
        conversationHistory.push(assistantMsg);
      }

      if (toolCalls.length > 0 && !isInterrupted) {
        await executeToolCalls({
          toolCalls, agentObj, toolAlreadyExecuted,
          conversationHistory, logPrefix: 'Web Tool',
          callId: callSid,
        });
        isProcessing = false;
        await executeCompletionFlow();
        return;
      }
    } catch (err) {
      log.error('web_completions_error', { error: err.message });
      // All providers failed/timed out — speak a recovery line instead of silence.
      if (!isInterrupted) {
        try {
          await processSentenceForPlay('Sorry, I missed that. Could you say it again?');
        } catch (_) { /* best-effort recovery */ }
      }
    } finally {
      isProcessing = false;
    }
  };

  const handleStartCall = async () => {
    const ownerUser = await User.findById(agentObj.userId).lean();
    let systemInstructions = buildSystemPrompt(agentObj.type, agentObj.prompt);
    if (ownerUser) systemInstructions = interpolatePrompt(systemInstructions, ownerUser);
    if (agentObj.type === 'appointment') systemInstructions += APPOINTMENT_BOOKING_RULES;
    systemInstructions += TIME_LIMIT_RULES;
    systemInstructions += CALLER_MEMORY_RULES;

    const agentLangName = LANGUAGE_NAMES[agentObj?.language || 'en'] || 'English';
    systemInstructions += `\n\nMULTILINGUAL & HUMAN SPEECH RULES:
1. You must respond in the same language that the user is speaking. If the user speaks or switches to another language (such as English, Hindi, Spanish, French, etc.), you MUST switch and reply in that language directly. Your default/starting language is ${agentLangName}.
2. Speak exactly like a natural, warm, and friendly human. Never sound robotic, and never output lists, tables, or bullet points.
3. When speaking in Hindi, use natural, conversational Hindi phrasing. Never write dates or times using spelled-out English words (e.g., do NOT say "twenty sixth july" or "four baje"). Instead, write them in standard digits or native Hindi words (e.g., say "26 जुलाई 2026" or "छब्बीस जुलाई" and "4 बजे" or "चार बजे"). Keep numbers and dates in standard format so the voice engine pronounces them naturally like a human.`;

    let greetingText = await generateGreeting({ groq, openaiClient, gemini, systemInstructions, agentType: agentObj.type, agentObj });
    const result = await translateIfNeeded(systemInstructions, greetingText, agentObj.language || 'en');
    systemInstructions = result.systemInstructions;
    greetingText = result.greetingText;

    conversationHistory.push({ role: 'system', content: systemInstructions });
    log.info('web_greeting', { greeting: greetingText });
    conversationHistory.push({ role: 'assistant', content: greetingText });
    fullTranscript += `Agent: ${greetingText}\n`;

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: greetingText }));
    }
    // Mark the agent as speaking so the caller can barge in over the greeting.
    isProcessing = true;
    try {
      await processSentenceForPlay(greetingText);
    } finally {
      isProcessing = false;
    }

    // Arm the hard 2-minute cap for the web call.
    callTimeout = setTimeout(endCallOnTimeLimit, MAX_CALL_DURATION_MS);
  };

  // Guarded cleanup so the 2-minute timeout and the socket 'close' event don't
  // double-run billing + recording.
  const runCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    await closeAndCleanup({ callSid, agentObj, callStartTime, fullTranscript, deepgramWs, pendingLeadData: toolAlreadyExecuted.pendingLeadData, recorder });
  };

  // Ends the web call once the 2-minute cap is reached: interrupt any in-flight
  // turn, play a closing line, notify the client, then clean up.
  const endCallOnTimeLimit = async () => {
    if (timeLimitReached || cleanedUp) return;
    timeLimitReached = true;
    log.info('web_call_time_limit_reached');
    isInterrupted = true;
    if (clientWs.readyState === WebSocket.OPEN) {
      try { clientWs.send(JSON.stringify({ event: 'clear' })); } catch (_) { /* gone */ }
    }
    isInterrupted = false;
    if (clientWs.readyState === WebSocket.OPEN) {
      try { clientWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: TIME_LIMIT_CLOSING })); } catch (_) { /* gone */ }
    }
    try {
      await processSentenceForPlay(TIME_LIMIT_CLOSING);
    } catch (_) { /* best-effort */ }
    setTimeout(() => {
      try { if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1000, 'Time limit reached'); } catch (_) { /* gone */ }
      runCleanup();
    }, 4000);
  };

  try {
    deepgramWs = await createDeepgramSTT({
      agentObj, encoding: 'linear16', sampleRate: 16000, logPrefix: 'Deepgram Web STT',
      onTranscript: (text) => {
        fullTranscript += `Caller: ${text}\n`;
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ event: 'transcript', role: 'caller', text }));
        }
        handleUserUtterance(text);
      },
      onInterruption: triggerInterruption,
    });
  } catch (sttErr) {
    log.error('deepgram_stt_init_failed', { error: sttErr.message });
  }
  await handleStartCall();

  clientWs.on('message', (message, isBinary) => {
    try {
      if (isBinary || Buffer.isBuffer(message) || message instanceof Uint8Array || message instanceof ArrayBuffer) {
        const audioBuffer = Buffer.from(message);
        recorder.writeAudio(audioBuffer, Date.now(), 16000);
        chunkCount++;
        if (chunkCount % 50 === 0 || chunkCount <= 5) {
          log.info('web_call_audio_chunk', { chunkCount, length: audioBuffer.length });
        }
        if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
          deepgramWs.send(audioBuffer);
        }
      } else {
        const data = JSON.parse(message.toString());
        if (data.event === 'stop') clientWs.close();
      }
    } catch (err) {
      log.error('web_ws_input_parse_error', { error: err.message });
    }
  });

  clientWs.on('close', async () => {
    log.info('web_call_connection_closed');
    await runCleanup();
  });
}
