import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import OpenAI from 'openai';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import User from '../db/models/User.js';
import { translateText, LANGUAGE_NAMES } from './translate.js';
import { getToolDefinitions, executeTool } from './appointmentTools.js';
import { synthesizeSpeech } from './tts.js';
import { uploadRecording } from './cloudinary.js';
import { log } from './logger.js';

const LANGUAGE_MAP = {
  en: 'en-IN', hi: 'hi', ta: 'ta', te: 'te',
  bn: 'bn', gu: 'gu', kn: 'kn', ml: 'ml',
  mr: 'mr', pa: 'pa', or: 'or',
};

// Groq deprecates/renames model ids over time; stored agent configs and the
// frontend dropdowns still use short aliases (e.g. `groq:llama-3.3-70b`).
// Map those to the current, valid Groq model ids so requests don't 404.
const GROQ_MODEL_ALIASES = {
  'llama-3.3-70b': 'llama-3.3-70b-versatile',
  'llama-3.1-70b': 'llama-3.1-70b-versatile',
  'llama-3.1-8b': 'llama-3.1-8b-instant',
};
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// Voice replies are spoken, so they should be short (1-3 sentences). Capping
// output tokens keeps turns snappy and slashes per-call token spend. ~160
// tokens ≈ 3-4 spoken sentences — enough to answer without rambling.
const MAX_REPLY_TOKENS = 160;
const REPLY_TEMPERATURE = 0.6;

function resolveGroqModel(modelId) {
  if (!modelId) return GROQ_DEFAULT_MODEL;
  return GROQ_MODEL_ALIASES[modelId] || modelId;
}

export function getLangCode(language) {
  return LANGUAGE_MAP[language] || 'en-IN';
}

export class ReconnectingDeepgramWS {
  constructor(url, options, logPrefix, onTranscript, onInterruption) {
    this.url = url;
    this.options = options;
    this.logPrefix = logPrefix;
    this.onTranscript = onTranscript;
    this.onInterruption = onInterruption;
    this.ws = null;
    this.intentionalClose = false;
    this.keepAliveTimer = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseDelay = 1000;
    this.lastProcessedTranscript = '';
  }

  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  async connect() {
    log.info('stt_connecting', { prefix: this.logPrefix, url: this.url });
    this.ws = new WebSocket(this.url, this.options);

    return new Promise((resolve, reject) => {
      let resolved = false;

      this.ws.once('open', () => {
        log.info('stt_connected', { prefix: this.logPrefix });
        this.reconnectAttempts = 0;
        this.startKeepAlive();
        resolved = true;
        resolve();
      });

      this.ws.once('error', (err) => {
        log.error('stt_connect_failed', { prefix: this.logPrefix, error: err.message });
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      this.setupHandlers();
    });
  }

  startKeepAlive() {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 8000);
    if (typeof this.keepAliveTimer.unref === 'function') {
      this.keepAliveTimer.unref();
    }
  }

  setupHandlers() {
    const activeWs = this.ws;

    activeWs.on('message', async (message) => {
      if (this.ws !== activeWs) return;
      try {
        const response = JSON.parse(message.toString());
        const transcript = response.channel?.alternatives?.[0]?.transcript;
        const isFinal = response.is_final;

        if (transcript && transcript.trim().length > 0) {
          if (isFinal) {
            if (transcript === this.lastProcessedTranscript) {
              log.info('stt_duplicate_final_ignored', { prefix: this.logPrefix, transcript });
              return;
            }
            this.lastProcessedTranscript = transcript;
            log.info('stt_final_transcript', { prefix: this.logPrefix, transcript });
            this.onTranscript(transcript, true);
          } else {
            // Interim (word-by-word) result. Whether this counts as a barge-in
            // is decided by the handler, which knows if the agent is speaking.
            this.onInterruption();
          }
        }
      } catch (err) {
        log.error('stt_parse_error', { prefix: this.logPrefix, error: err.message });
      }
    });

    activeWs.on('error', (err) => {
      if (this.ws !== activeWs) return;
      log.error('stt_error', { prefix: this.logPrefix, error: err.message });
    });

    activeWs.on('close', (code, reason) => {
      if (this.ws !== activeWs) return;
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
      log.info('stt_closed', { prefix: this.logPrefix, code, reason: reason ? reason.toString() : 'none' });
      if (!this.intentionalClose) {
        this.attemptReconnect();
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error('stt_max_reconnect_reached', { prefix: this.logPrefix });
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    log.info('stt_reconnecting', { prefix: this.logPrefix, delay, attempt: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts });

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (err) {
        // Safe to ignore here, as the 'close' event from the new failed socket will trigger the next retry.
      }
    }, delay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      log.warn('stt_drop_audio', { prefix: this.logPrefix });
    }
  }

  close(code, reason) {
    this.intentionalClose = true;
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(code, reason);
        }
      } catch (err) {
        log.error('stt_close_error', { prefix: this.logPrefix, error: err.message });
      }
    }
  }
}

export function createDeepgramSTT({ agentObj, encoding, sampleRate, logPrefix, onTranscript, onInterruption }) {
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramKey || deepgramKey.startsWith('your-')) {
    return Promise.reject(new Error('DEEPGRAM_API_KEY is not set'));
  }

  const langCode = getLangCode(agentObj?.language || 'en');
  const langParam = (agentObj?.language === 'en' || !agentObj?.language) ? 'multi' : langCode;
  const deepgramUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=${langParam}&encoding=${encoding}&sample_rate=${sampleRate}&interim_results=true&endpointing=350&utterance_end_ms=1000&vad_events=true&smart_format=true`;

  const wrapper = new ReconnectingDeepgramWS(
    deepgramUrl,
    { headers: { 'Authorization': `Token ${deepgramKey}` } },
    logPrefix,
    onTranscript,
    onInterruption
  );

  return wrapper.connect().then(() => wrapper);
}

export function createLLMClient() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;

  let openaiClient = null;
  let groq = null;
  let gemini = null;

  if (OPENAI_API_KEY && OPENAI_API_KEY.trim() !== '' && !OPENAI_API_KEY.startsWith('your-')) {
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  if (GROQ_API_KEY) {
    groq = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: GROQ_API_KEY,
    });
  }
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '' && !GEMINI_API_KEY.startsWith('your-')) {
    gemini = new OpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: GEMINI_API_KEY,
    });
  }

  return { groq, openaiClient, gemini };
}

async function requestCompletion(client, modelName, messages, tools, timeoutMs = 12000) {
  const isGemini = modelName.toLowerCase().includes('gemini');

  if (isGemini) {
    log.info('llm_gemini_non_streamed', { model: modelName });
    const completion = await client.chat.completions.create({
      model: modelName,
      messages,
      stream: false,
      max_tokens: MAX_REPLY_TOKENS,
      temperature: REPLY_TEMPERATURE,
      ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
    }, { timeout: timeoutMs });

    // Return a mock async generator stream
    return {
      async *[Symbol.asyncIterator]() {
        yield {
          choices: [
            {
              delta: {
                content: completion.choices[0]?.message?.content || null,
                tool_calls: completion.choices[0]?.message?.tool_calls || null,
              }
            }
          ]
        };
      }
    };
  } else {
    // Standard stream call
    return client.chat.completions.create({
      model: modelName,
      messages,
      stream: true,
      max_tokens: MAX_REPLY_TOKENS,
      temperature: REPLY_TEMPERATURE,
      ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
    }, { timeout: timeoutMs });
  }
}

export async function generateCompletion({ groq, openaiClient, gemini, conversationHistory, agentType, agentObj, logPrefix = 'LLM', toolState }) {
  let tools = getToolDefinitions(agentType);

  if (toolState) {
    tools = tools.filter(t => {
      if (t.function.name === 'saveLead' && toolState.saveLead) return false;
      if (t.function.name === 'saveAppointment' && toolState.saveAppointment) return false;
      return true;
    });
  }
  const EXTENDED_TOOLS = new Set([
    'getAppointment', 'updateAppointment', 'cancelAppointment', 'checkEmergencyAvailability',
  ]);
  const recentText = conversationHistory
    .filter(m => m.role === 'user' && typeof m.content === 'string')
    .slice(-4)
    .map(m => m.content.toLowerCase())
    .join(' ');
  const MANAGEMENT_INTENT = /reschedul|re-schedul|change|move|postpone|cancel|cancle|existing|already|my appointment|look ?up|find my|emergenc|urgent/;
  if (!MANAGEMENT_INTENT.test(recentText)) {
    tools = tools.filter(t => !EXTENDED_TOOLS.has(t.function.name));
  }

  // Strip out old tool execution logs to save massive amounts of tokens.
  // We only retain tool call/response messages if they are in the last 4 turns.
  let cleanedMessages = [];
  const systemMsg = conversationHistory.find(m => m.role === 'system');
  if (systemMsg) cleanedMessages.push(systemMsg);

  const nonSystemMessages = conversationHistory.filter(m => m.role !== 'system');
  const toolCutoff = nonSystemMessages.length - 4;

  for (let i = 0; i < nonSystemMessages.length; i++) {
    const msg = nonSystemMessages[i];
    const isToolRelated = msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls && !msg.content);
    if (isToolRelated && i < toolCutoff) {
      continue; // Prune old tool messages
    }
    cleanedMessages.push(msg);
  }

  // Slice the recent conversation context to a light 6-message limit
  let prunedHistory = [];
  if (systemMsg) prunedHistory.push(systemMsg);

  const recentMessages = cleanedMessages.filter(m => m.role !== 'system');
  const desiredLimit = 6;
  let startIndex = Math.max(0, recentMessages.length - desiredLimit);
  
  // Adjust startIndex backward to prevent splitting an assistant tool call from its tool responses
  while (startIndex > 0 && (recentMessages[startIndex].role === 'tool' || (recentMessages[startIndex].role === 'assistant' && recentMessages[startIndex].tool_calls))) {
    startIndex--;
  }

  const slicedRecent = recentMessages.slice(startIndex);
  prunedHistory = prunedHistory.concat(slicedRecent);

  // Normalize prunedHistory to ensure that every assistant tool call has a corresponding tool response
  const activeToolCallIds = new Set(
    prunedHistory.filter(m => m.role === 'tool').map(m => m.tool_call_id)
  );

  prunedHistory = prunedHistory.map(m => {
    if (m.role === 'assistant' && m.tool_calls) {
      const validCalls = m.tool_calls.filter(tc => activeToolCallIds.has(tc.id));
      if (validCalls.length > 0) {
        return { ...m, tool_calls: validCalls };
      } else {
        const { tool_calls, ...rest } = m;
        return { ...rest, content: rest.content || 'Processing...' };
      }
    }
    return m;
  });

  const engineSelected = agentObj?.customEngineModel || 'groq:llama-3.3-70b';
  const [provider, modelId] = engineSelected.split(':');

  // Build client candidate list based on starting engine selection
  const candidates = [];
  if (provider === 'gemini' && gemini) {
    candidates.push({ name: 'Gemini', client: gemini, model: modelId || 'gemini-2.5-flash' });
  } else if (provider === 'openai' && openaiClient) {
    candidates.push({ name: 'OpenAI', client: openaiClient, model: modelId || 'gpt-4o-mini' });
  } else if (groq) {
    candidates.push({ name: 'Groq', client: groq, model: resolveGroqModel(modelId) });
  }

  // Load backups to candidates list in standard order
  if (groq && !candidates.some(c => c.name === 'Groq')) {
    candidates.push({ name: 'Groq', client: groq, model: GROQ_DEFAULT_MODEL });
  }
  if (openaiClient && !candidates.some(c => c.name === 'OpenAI')) {
    candidates.push({ name: 'OpenAI', client: openaiClient, model: 'gpt-4o-mini' });
  }
  if (gemini && !candidates.some(c => c.name === 'Gemini')) {
    candidates.push({ name: 'Gemini', client: gemini, model: 'gemini-2.5-flash' });
  }

  if (candidates.length === 0) {
    throw new Error('No LLM providers (Groq, OpenAI, Gemini) are configured or available');
  }

  let stream = null;
  let lastErr = null;

  for (const candidate of candidates) {
    try {
      log.info('llm_attempt', { prefix: logPrefix, provider: candidate.name, model: candidate.model });
      stream = await requestCompletion(candidate.client, candidate.model, prunedHistory, tools, 12000);
      break; // Success!
    } catch (err) {
      log.warn('llm_provider_failed', { prefix: logPrefix, provider: candidate.name, error: err.message });
      lastErr = err;
    }
  }

  if (!stream) {
    throw lastErr || new Error('All LLM providers failed to generate completion');
  }

  return { stream, tools };
}

export function stripToolCallsFromText(text) {
  if (!text) return '';
  let cleaned = text.replace(/<function[^>]*>[\s\S]*?<\/function>/gi, '');
  cleaned = cleaned.replace(/[a-zA-Z0-9_]+\s*>\s*[\s\S]*?<\/function>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/gi, '');
  cleaned = cleaned.replace(/<\/?[a-zA-Z0-9_=\s"'{}:,]+>/gi, '');
  return cleaned.trim();
}

export async function processStream({ stream, isInterrupted, onSentence }) {
  let sentenceBuffer = '';
  let fullResponseText = '';
  let toolCalls = [];

  for await (const chunk of stream) {
    if (isInterrupted) return { fullResponseText: '', toolCalls: [], interrupted: true };

    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      sentenceBuffer += delta.content;

      if (/[.!?\n]/.test(sentenceBuffer)) {
        const sentence = sentenceBuffer.trim();
        sentenceBuffer = '';
        if (sentence.length > 0) {
          const cleanSentence = stripToolCallsFromText(sentence);
          if (cleanSentence.length > 0) {
            fullResponseText += (fullResponseText ? ' ' : '') + cleanSentence;
            await onSentence(cleanSentence);
          }
        }
      }
    }

    if (delta?.tool_calls) {
      for (const tcDelta of delta.tool_calls) {
        const idx = tcDelta.index;
        if (!toolCalls[idx]) {
          toolCalls[idx] = { id: tcDelta.id, name: '', arguments: '' };
        }
        if (tcDelta.id) toolCalls[idx].id = tcDelta.id;
        if (tcDelta.function?.name) toolCalls[idx].name += tcDelta.function.name;
        if (tcDelta.function?.arguments) toolCalls[idx].arguments += tcDelta.function.arguments;
      }
    }
  }

  if (sentenceBuffer.trim().length > 0) {
    const cleanSentence = stripToolCallsFromText(sentenceBuffer.trim());
    if (cleanSentence.length > 0) {
      fullResponseText += (fullResponseText ? ' ' : '') + cleanSentence;
      await onSentence(cleanSentence);
    }
  }

  return { fullResponseText, toolCalls, interrupted: false };
}

export async function executeToolCalls({ toolCalls, agentObj, toolAlreadyExecuted, conversationHistory, logPrefix = 'Tool', callId }) {
  for (const tc of toolCalls) {
    const name = tc.name;
    let args = {};
    try {
      args = JSON.parse(tc.arguments);
    } catch {
      log.warn('tool_parse_arguments_failed', { prefix: logPrefix });
    }
    log.info('tool_execute', { prefix: logPrefix, tool: name, args });

    const result = await executeTool(name, args, {
      agentObj,
      toolState: toolAlreadyExecuted,
      callId,
    });

    conversationHistory.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(result)
    });
  }
}

const FIRST_MESSAGES = {
  receptionist: 'Thank you for calling, how can I help you today?',
  appointment: 'Hello! I can help you book an appointment. What service are you looking for today?',
  faq: 'Hi there! I am here to answer your questions. What would you like to know?',
};

export async function generateGreeting({ groq, openaiClient, gemini, systemInstructions, agentType, agentObj }) {
  // If a custom prompt is configured for the agent, generate opening greeting strictly from the agent's prompt
  if (agentObj?.prompt && agentObj.prompt.trim().length > 15) {
    const client = groq || openaiClient || gemini;
    if (client) {
      try {
        const modelName = groq ? GROQ_DEFAULT_MODEL : (openaiClient ? 'gpt-4o-mini' : 'gemini-2.5-flash');
        const completion = await client.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemInstructions },
            { role: 'user', content: 'The call just connected. Speak ONLY your opening greeting to the caller based strictly on your role and system instructions above.' },
          ],
          max_tokens: 60,
          temperature: 0.5,
        });
        const customGreeting = completion.choices[0]?.message?.content?.trim();
        if (customGreeting) {
          log.info('greeting_generated', { greeting: customGreeting });
          return customGreeting;
        }
      } catch (err) {
        log.warn('greeting_fallback', { error: err.message });
      }
    }
  }

  return FIRST_MESSAGES[agentType] || FIRST_MESSAGES.receptionist;
}

export async function translateIfNeeded(systemInstructions, greetingText, language) {
  if (language && language !== 'en') {
    const langName = LANGUAGE_NAMES[language] || language;
    try {
      // Only translate the greeting text to target language. Keep system instructions in English
      // so the LLM retains 100% precise tool-calling, structure, and prompt-following capability.
      greetingText = await translateText(greetingText, language);
      systemInstructions += `\n\nLANGUAGE RULE: Your default/starting language is ${langName}. You must greet and respond in ${langName}. However, if the user speaks or switches to another language (such as English, Hindi, etc.), you MUST switch and respond in the user's language directly.`;
    } catch (trErr) {
      log.error('translation_failed', { error: trErr.message });
    }
  }
  return { systemInstructions, greetingText };
}

export async function closeAndCleanup({ callSid, agentObj, callStartTime, fullTranscript, deepgramWs, pendingLeadData, recorder }) {
  if (deepgramWs) {
    try {
      deepgramWs.close();
    } catch (err) {
      log.error('cleanup_deepgram_close_error', { error: err.message });
    }
  }

  try {
    if (callSid) {
      const durationSeconds = Math.round((new Date().getTime() - callStartTime.getTime()) / 1000);

      let recordingUrl = null;
      if (recorder) {
        try {
          const wavBuffer = recorder.getWavBuffer();
          log.info('audio_recording_wav_buffer', { size: wavBuffer.length, maxByteOffset: recorder.maxByteOffset });
          if (recorder.maxByteOffset > 0) {
            const filename = `${callSid}.wav`;
            recordingUrl = await uploadRecording(wavBuffer, filename);
            log.info('audio_recording_uploaded', { url: recordingUrl });
          } else {
            log.info('audio_recording_no_data');
          }
        } catch (recErr) {
          log.error('audio_recording_upload_failed', { error: recErr.message, stack: recErr.stack });
        }
      } else {
        log.info('audio_recording_no_recorder');
      }

      const updateData = {
        status: 'completed',
        duration: durationSeconds,
        endedAt: new Date(),
        transcript: fullTranscript.trim() || 'No transcript generated',
      };
      if (recordingUrl) {
        updateData.recordingUrl = recordingUrl;
      }

      await Call.findOneAndUpdate({ vapiCallId: callSid }, updateData);

      if (agentObj && durationSeconds > 0) {
        const billingMinutes = Math.ceil(durationSeconds / 60);
        // Flip a one-time `billed` flag atomically. If it was already set (a
        // duplicate cleanup, a retry, or a restart re-running this path), the
        // filter won't match and we skip the non-idempotent $inc — no double charge.
        const flip = await Call.findOneAndUpdate(
          { vapiCallId: callSid, billed: { $ne: true } },
          { $set: { billed: true } }
        );
        if (flip) {
          await User.findByIdAndUpdate(agentObj.userId, {
            $inc: { minutesUsed: billingMinutes, callsUsed: 1 }
          });
          log.info('billing_added', { minutes: billingMinutes, userId: agentObj.userId });
        } else {
          log.info('billing_skipped', { callSid });
        }
      }
    }

    // Save pending lead data when conversation ends (only if not already saved during the call)
    if (pendingLeadData && (pendingLeadData.name || pendingLeadData.phone)) {
      // Resolve mongoCallId to prevent BSON/Cast validation errors for Twilio callSids
      let mongoCallId = null;
      if (pendingLeadData.callId) {
        if (mongoose.Types.ObjectId.isValid(pendingLeadData.callId)) {
          mongoCallId = pendingLeadData.callId;
        } else {
          const callDoc = await Call.findOne({ vapiCallId: pendingLeadData.callId }).select('_id').lean();
          if (callDoc) mongoCallId = callDoc._id;
        }
      }
      pendingLeadData.callId = mongoCallId;

      const existingLead = await Lead.findOne({
        agentId: pendingLeadData.agentId,
        $or: [
          ...(mongoCallId ? [{ callId: mongoCallId }] : []),
          ...(pendingLeadData.phone ? [{ phone: pendingLeadData.phone }] : [])
        ]
      }).lean();

      if (!existingLead) {
        const lead = await Lead.create(pendingLeadData);
        log.info('lead_saved', { leadId: lead._id, agentId: pendingLeadData.agentId });
      }
    }
  } catch (dbErr) {
    log.error('close_cleanup_error', { error: dbErr.message });
  }
}

// ─── Shared Caller Info Extraction ────────────────────────────────────────────
// Used by handleTwilioStream, handleExotelStream, and handleWebCall to avoid
// duplicating regex-based PII extraction across all three handlers.

const NAME_PATTERNS = [
  /(?:my name is|i'm|i am|this is|name's|name:)\s+([A-Za-z][A-Za-z\s]{1,30})/i,
];
const PHONE_PATTERNS = [
  /(?:my (?:phone |number |cell )?(?:number|is|:))\s*([\d\s\-+()]{7,20})/i,
  /(?:call me at|reach me at|number is)\s*([\d\s\-+()]{7,20})/i,
  /\b(\d{10,15})\b/,
];
const NAME_NOISE = /unknown|none|test|hello|hi|hey/i;

export function extractCallerInfo(text, callerInfo) {
  if (!text) return;

  if (!callerInfo.name) {
    for (const pat of NAME_PATTERNS) {
      const m = text.match(pat);
      if (m && m[1] && !NAME_NOISE.test(m[1].trim())) {
        callerInfo.name = m[1].trim();
        break;
      }
    }
  }

  if (!callerInfo.phone) {
    for (const pat of PHONE_PATTERNS) {
      const m = text.match(pat);
      if (m && m[1]) {
        const digits = m[1].replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          callerInfo.phone = m[1].trim();
          break;
        }
      }
    }
  }
}

export function injectCallerContext(conversationHistory, callerInfo) {
  if (!callerInfo.name && !callerInfo.phone) return;
  const sysIdx = conversationHistory.findIndex(m => m.role === 'system');
  if (sysIdx === -1) return;

  let ctx = '\n\nCALLER CONTEXT (already provided — do NOT ask again):';
  if (callerInfo.name) ctx += `\n- Name: ${callerInfo.name}`;
  if (callerInfo.phone) ctx += `\n- Phone: ${callerInfo.phone}`;
  ctx += '\nUse this information directly. Never re-ask for details already listed above.';

  const base = conversationHistory[sysIdx].content.replace(/\n\nCALLER CONTEXT \(already provided[^)]*\):[\s\S]*$/, '');
  conversationHistory[sysIdx] = { role: 'system', content: base + ctx };
}
