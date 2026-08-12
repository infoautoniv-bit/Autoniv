import WebSocket from 'ws';
import mongoose from 'mongoose';

import Agent from '../../db/models/Agent.js';
import Call from '../../db/models/Call.js';
import User from '../../db/models/User.js';

import { synthesizeSpeech } from '../speech/tts.js';
import { LANGUAGE_NAMES } from '../speech/translate.js';
import { AudioRecorder } from '../audioRecorder.js';
import { verifyMediaStreamToken } from '../auth/mediaStreamToken.js';
import { log } from '../logger.js';
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
} from './shared.js';
import {
  buildSystemPrompt,
  interpolatePrompt,
  APPOINTMENT_BOOKING_RULES,
  TIME_LIMIT_RULES,
  CALLER_MEMORY_RULES,
  TIME_LIMIT_CLOSING,
  MAX_CALL_DURATION_MS,
} from './prompts.js';

let sharedLLM = null;
function getSharedLLM() {
  if (!sharedLLM) sharedLLM = createLLMClient();
  return sharedLLM;
}

export function handleTwilioStream(twilioWs, urlAgentId) {
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
  const recorder = new AudioRecorder(24000);

  const { groq, openaiClient, gemini } = getSharedLLM();
  const runCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    try {
      if (twilioWs && (twilioWs.readyState === WebSocket.OPEN || twilioWs.readyState === WebSocket.CONNECTING)) {
        twilioWs.close(1000, 'Normal closure');
      }
    } catch (_) {}
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

        const CHUNK_SIZE = 640;
        const CHUNK_INTERVAL_MS = 80;
        for (let offset = 0; offset < agentAudio.length; offset += CHUNK_SIZE) {
          if (isInterrupted || twilioWs.readyState !== WebSocket.OPEN) break;
          const chunk = agentAudio.subarray(offset, offset + CHUNK_SIZE);
          twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid,
            media: { payload: chunk.toString('base64') }
          }));
          if (offset + CHUNK_SIZE < agentAudio.length) {
            await new Promise((r) => setTimeout(r, CHUNK_INTERVAL_MS));
          }
        }

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
        } catch (_) {}
      }
    } finally {
      isProcessing = false;
    }
  };

  const handleStartCall = async () => {
    recorder.startTime = Date.now();
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
    isProcessing = true;
    isInterrupted = false;
    try {
      await processSentenceForPlay(greetingText);
    } finally {
      isProcessing = false;
    }

    callTimeout = setTimeout(endCallOnTimeLimit, MAX_CALL_DURATION_MS);
  };

  const endCallOnTimeLimit = async () => {
    if (timeLimitReached || cleanedUp) return;
    timeLimitReached = true;
    log.info('twilio_call_time_limit_reached');
    isInterrupted = true;
    if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
      try { twilioWs.send(JSON.stringify({ event: 'clear', streamSid })); } catch (_) {}
    }
    isInterrupted = false;
    try {
      await processSentenceForPlay(TIME_LIMIT_CLOSING);
    } catch (_) {}
    setTimeout(() => {
      try { if (twilioWs.readyState === WebSocket.OPEN) twilioWs.close(1000, 'Time limit reached'); } catch (_) {}
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
          recorder.writeMulaw8k(inboundMulaw, Date.now());
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

  twilioWs.on('error', async (err) => {
    log.error('twilio_ws_error', { error: err.message });
    await runCleanup();
  });

  twilioWs.on('close', async () => {
    log.info('twilio_connection_closed');
    await runCleanup();
  });
}
