import WebSocket from 'ws';
import mongoose from 'mongoose';

import Agent from '../../db/models/Agent.js';
import Call from '../../db/models/Call.js';
import User from '../../db/models/User.js';
import PhoneNumber from '../../db/models/PhoneNumber.js';

import { synthesizeSpeech } from '../speech/tts.js';
import { LANGUAGE_NAMES } from '../speech/translate.js';
import { AudioRecorder } from '../audioRecorder.js';
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

export async function handleExotelStream(exotelWs) {
  log.info('exotel_stream_connected');

  let streamSid = null;
  let callSid = null;
  let agentObj = null;
  let exotelToNumber = null;
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
  const EXOTEL_SAMPLE_RATE = 8000;
  const recorder = new AudioRecorder(EXOTEL_SAMPLE_RATE);
  let muteInputUntil = 0;

  const { groq, openaiClient, gemini } = getSharedLLM();

  const runCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    try {
      if (exotelWs && (exotelWs.readyState === WebSocket.OPEN || exotelWs.readyState === WebSocket.CONNECTING)) {
        exotelWs.close(1000, 'Normal closure');
      }
    } catch (_) {}
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
      try { exotelWs.send(JSON.stringify({ event: 'clear', stream_sid: streamSid })); } catch (_) {}
    }
    isInterrupted = false;
    if (exotelWs.readyState === WebSocket.OPEN) {
      try { exotelWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: TIME_LIMIT_CLOSING })); } catch (_) {}
    }
    try {
      await processSentenceForPlay(TIME_LIMIT_CLOSING);
    } catch (_) {}
    setTimeout(() => {
      try { if (exotelWs.readyState === WebSocket.OPEN) exotelWs.close(1000, 'Time limit reached'); } catch (_) {}
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
      const base64Audio = await synthesizeSpeech(sentence, { encoding: 'linear16', sampleRate: EXOTEL_SAMPLE_RATE }, agentObj?.language || 'en', agentObj?.voiceId);
      if (base64Audio && !isInterrupted) {
        const agentAudioBuffer = Buffer.from(base64Audio, 'base64');
        recorder.writeAudio(agentAudioBuffer, Date.now(), EXOTEL_SAMPLE_RATE);

        if (exotelWs.readyState === WebSocket.OPEN && streamSid) {
          const CHUNK_SIZE = 1280; // 40ms of 16-bit 8kHz PCM (1280 bytes)
          const CHUNK_INTERVAL_MS = 40;
          for (let offset = 0; offset < agentAudioBuffer.length; offset += CHUNK_SIZE) {
            if (isInterrupted || exotelWs.readyState !== WebSocket.OPEN) break;
            const chunk = agentAudioBuffer.subarray(offset, offset + CHUNK_SIZE);
            exotelWs.send(JSON.stringify({
              event: 'media',
              stream_sid: streamSid,
              media: { payload: chunk.toString('base64') },
            }));
            if (offset + CHUNK_SIZE < agentAudioBuffer.length) {
              await new Promise((r) => setTimeout(r, CHUNK_INTERVAL_MS));
            }
          }

          if (exotelWs.readyState === WebSocket.OPEN) {
            exotelWs.send(JSON.stringify({
              event: 'mark',
              stream_sid: streamSid,
              mark: { name: 'sentence_played' },
            }));
          }
        }
        const playbackMs = (agentAudioBuffer.length / 2) / (EXOTEL_SAMPLE_RATE / 1000);
        muteInputUntil = Math.max(muteInputUntil, Date.now() + playbackMs + ECHO_TAIL_MS);
      }
    } catch (err) {
      log.error('exotel_tts_synthesis_failed', { error: err.message });
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
        try { await processSentenceForPlay('Sorry, I missed that. Could you say it again?'); } catch (_) {}
      }
    } finally {
      isProcessing = false;
    }
  };

  const handleStartCall = async () => {
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
          agentObj._exotelCredentials = phoneNumber.credentials || {};
          log.info('database_agent_loaded', { method: 'exotel_phone_number', name: agentObj.name });
        }
      }
      if (!agentObj && callSid && mongoose.Types.ObjectId.isValid(callSid)) {
        const callObj = await Call.findOne({ vapiCallId: callSid }).populate('agentId').lean();
        if (callObj?.agentId) {
          agentObj = callObj.agentId;
          log.info('database_agent_loaded', { method: 'exotel_call_record', name: agentObj.name });
        }
      }

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
    isInterrupted = false;
    try {
      await processSentenceForPlay(greetingText);
    } finally {
      isProcessing = false;
    }

    callTimeout = setTimeout(endCallOnTimeLimit, MAX_CALL_DURATION_MS);
  };

  exotelWs.on('message', (raw, isBinary) => {
    try {
      if (isBinary || Buffer.isBuffer(raw) || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
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
          streamSid = data.stream_sid || data.start?.stream_sid || null;
          exotelToNumber = data.start?.to || null;
          callSid = data.start?.call_sid || 'exotel-call';
          log.info('exotel_stream_started', { streamSid, callSid, from: data.start?.from, to: exotelToNumber });
          handleStartCall();
          break;

        case 'media': {
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
          log.info('exotel_dtmf', { digit: data.dtmf?.digit });
          break;

        case 'mark':
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

  exotelWs.on('error', async (err) => {
    log.error('exotel_ws_error', { error: err.message });
    await runCleanup();
  });

  exotelWs.on('close', async () => {
    log.info('exotel_connection_closed');
    await runCleanup();
  });
}
