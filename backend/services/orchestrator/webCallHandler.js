import WebSocket from 'ws';
import mongoose from 'mongoose';

import Agent from '../../db/models/Agent.js';
import Call from '../../db/models/Call.js';
import User from '../../db/models/User.js';
import { DEMO_AGENT, DEMO_PERSONAS } from '../../routes/agents/publicDemo.js';

import { cachedSynthesizeSpeech } from '../speech/ttsCache.js';
import { LANGUAGE_NAMES } from '../speech/translate.js';
import { AudioRecorder } from '../audioRecorder.js';
import { log } from '../logger.js';
import { callManager } from './callManager.js';
import { llmQueue } from './llmQueue.js';
import { fetchPreCallContext } from './preCallService.js';
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
  SYSTEM_SAFETY_GUARDRAILS,
  HUMAN_VOICE_CADENCE_RULES,
  TIME_LIMIT_CLOSING,
  MAX_CALL_DURATION_MS,
} from './prompts.js';

let sharedLLM = null;
function getSharedLLM() {
  if (!sharedLLM) sharedLLM = createLLMClient();
  return sharedLLM;
}

export async function handleWebCall(clientWs, req) {
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
  let toolAlreadyExecuted = { saveAppointment: false, saveLead: false, logComplaint: false, transferCall: false };
  let callerInfo = { name: null, phone: null, email: null };
  const recorder = new AudioRecorder(24000);
  let callTimeout = null;
  let timeLimitReached = false;
  let cleanedUp = false;
  let agentRegistered = false;

  const { groq, openaiClient, gemini } = getSharedLLM();

  try {
    if (isDemo) {
      const personaKey = parsedUrl.searchParams.get('persona') || 'default';
      const voiceOverride = parsedUrl.searchParams.get('voiceId');
      const personaConfig = DEMO_PERSONAS?.[personaKey] || DEMO_AGENT;
      agentObj = {
        _id: 'demo',
        name: personaConfig.name || 'Autoniv AI Assistant',
        type: personaConfig.type || 'receptionist',
        language: personaConfig.language || 'en',
        voiceId: voiceOverride || personaConfig.voiceId || 'EXAVITQu4vr4xnSDxMaL',
        firstMessage: personaConfig.firstMessage,
        prompt: personaConfig.prompt || DEMO_AGENT.prompt,
      };
    } else {
      agentObj = await Agent.findById(agentId);
      if (!agentObj) { clientWs.close(4001, 'Agent not found'); return; }
    }

    const agentIdStr = isDemo ? 'demo' : agentObj._id.toString();
    const maxConcurrent = isDemo ? 10 : (agentObj.maxConcurrentCalls || 1);
    if (!callManager.canAcceptCall(agentIdStr, maxConcurrent)) {
      log.warn('web_call_rejected_concurrent_limit', { agentId: agentIdStr, maxConcurrent });
      clientWs.close(4003, 'Agent concurrent call limit reached');
      return;
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

    callManager.registerCall(agentIdStr, callSid);
    agentRegistered = true;
  } catch (err) {
    log.error('web_call_setup_error', { error: err.message });
    clientWs.close(4999, 'Database setup error');
    return;
  }

  const triggerInterruption = () => {
    if (isInterrupted) return;
    isInterrupted = true;
    log.info('web_interruption', { message: 'Caller barged in — stopping agent playback (<50ms VAD).' });
    if (clientWs.readyState === WebSocket.OPEN) {
      try { clientWs.send(JSON.stringify({ event: 'clear' })); } catch (_) {}
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
      const base64Audio = await cachedSynthesizeSpeech(sentence, false, agentObj.language || 'en', agentObj.voiceId);
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
      const { stream } = await llmQueue.add(() => generateCompletion({
        groq, openaiClient, gemini, conversationHistory,
        agentType: agentObj?.type, logPrefix: 'Web LLM',
        toolState: toolAlreadyExecuted,
        agentObj,
      }), agentObj?.customEngineModel?.split(':')[0] || 'groq');

      const { fullResponseText, toolCalls, interrupted } = await processStream({
        stream,
        checkInterrupted: () => isInterrupted,
        onSentence: processSentenceForPlay,
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
    const ownerUser = isDemo ? null : await User.findById(agentObj.userId).lean();
    
    // Fetch pre-call context
    const preCallContext = await fetchPreCallContext(callerInfo.phone || null, agentObj);
    if (preCallContext.callerName && !callerInfo.name) {
      callerInfo.name = preCallContext.callerName;
    }

    let systemInstructions = buildSystemPrompt(agentObj.type, agentObj.prompt);
    if (ownerUser) systemInstructions = interpolatePrompt(systemInstructions, ownerUser, preCallContext);
    if (agentObj.type === 'appointment') systemInstructions += APPOINTMENT_BOOKING_RULES;
    systemInstructions += TIME_LIMIT_RULES;
    systemInstructions += CALLER_MEMORY_RULES;
    systemInstructions += SYSTEM_SAFETY_GUARDRAILS;
    systemInstructions += HUMAN_VOICE_CADENCE_RULES;

    const agentLangName = LANGUAGE_NAMES[agentObj?.language || 'en'] || 'English';
    systemInstructions += `\n\nMULTILINGUAL & HUMAN SPEECH RULES:
1. You must respond in the same language that the user is speaking. If the user speaks or switches to another language (such as English, Hindi, Spanish, French, etc.), you MUST switch and reply in that language directly. Your default/starting language is ${agentLangName}.
2. Speak exactly like a natural, warm, and friendly human. Never sound robotic, and never output lists, tables, or bullet points.
3. When speaking in Hindi, use natural, conversational Hindi phrasing. Never write dates or times using spelled-out English words (e.g., do NOT say "twenty sixth july" or "four baje"). Instead, write them in standard digits or native Hindi words (e.g., say "26 जुलाई 2026" or "छब्बीस जुलाई" and "4 बजे" or "चार बजे"). Keep numbers and dates in standard format so the voice engine pronounces them naturally like a human.`;

    let greetingText = agentObj.firstMessage || await generateGreeting({
      groq, openaiClient, gemini, systemInstructions,
      agentType: agentObj.type,
      agentObj,
      context: preCallContext,
    });
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
    isProcessing = true;
    try {
      await processSentenceForPlay(greetingText);
    } finally {
      isProcessing = false;
    }

    callTimeout = setTimeout(endCallOnTimeLimit, MAX_CALL_DURATION_MS);
  };

  const runCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    if (agentRegistered) {
      const agentIdStr = isDemo ? 'demo' : agentObj._id.toString();
      callManager.unregisterCall(agentIdStr, callSid);
    }
    await closeAndCleanup({ callSid, agentObj, callStartTime, fullTranscript, deepgramWs, pendingLeadData: toolAlreadyExecuted.pendingLeadData, recorder });
  };

  const endCallOnTimeLimit = async () => {
    if (timeLimitReached || cleanedUp) return;
    timeLimitReached = true;
    log.info('web_call_time_limit_reached');
    isInterrupted = true;
    if (clientWs.readyState === WebSocket.OPEN) {
      try { clientWs.send(JSON.stringify({ event: 'clear' })); } catch (_) {}
    }
    isInterrupted = false;
    if (clientWs.readyState === WebSocket.OPEN) {
      try { clientWs.send(JSON.stringify({ event: 'transcript', role: 'agent', text: TIME_LIMIT_CLOSING })); } catch (_) {}
    }
    try {
      await processSentenceForPlay(TIME_LIMIT_CLOSING);
    } catch (_) {}
    setTimeout(() => {
      try { if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1000, 'Time limit reached'); } catch (_) {}
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
