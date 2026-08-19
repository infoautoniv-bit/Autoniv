/**
 * Plivo AudioStream WebSocket Handler
 * Supports Plivo bidirectional voice streaming with real-time audio playback.
 */

import WebSocket from 'ws';
import mongoose from 'mongoose';
import Agent from '../../db/models/Agent.js';
import Call from '../../db/models/Call.js';

import { cachedSynthesizeSpeech } from '../speech/ttsCache.js';
import { AudioRecorder } from '../audioRecorder.js';
import { log } from '../logger.js';
import { callManager } from './callManager.js';
import { fetchPreCallContext } from './preCallService.js';
import { ConversationGraph } from './conversationGraph.js';
import {
  createDeepgramSTT,
  createLLMClient,
  generateCompletion,
  processStream,
  executeToolCalls,
  generateGreeting,
  closeAndCleanup,
} from './shared.js';
import { MAX_CALL_DURATION_MS } from './prompts.js';

let sharedLLM = null;
function getSharedLLM() {
  if (!sharedLLM) sharedLLM = createLLMClient();
  return sharedLLM;
}

export function handlePlivoStream(plivoWs, urlAgentId) {
  log.info('plivo_stream_connected');

  let streamId = null;
  let callUuid = null;
  let agentObj = null;
  let resolvedAgentId = urlAgentId;
  let conversationHistory = [];
  let fullTranscript = '';
  const callStartTime = new Date();
  let deepgramWs = null;
  let isInterrupted = false;
  let isProcessing = false;
  let toolAlreadyExecuted = { saveAppointment: false, saveLead: false, logComplaint: false, transferCall: false };
  let callerInfo = { name: null, phone: null, email: null };
  let cleanedUp = false;
  let agentRegistered = false;
  let callTimeout = null;

  const conversationGraph = new ConversationGraph();
  const recorder = new AudioRecorder(8000);
  const { groq, openaiClient, gemini } = getSharedLLM();

  const runCleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (callTimeout) clearTimeout(callTimeout);
    if (resolvedAgentId && agentRegistered) {
      callManager.unregister(resolvedAgentId);
    }
    await closeAndCleanup({
      deepgramWs,
      callSid: callUuid,
      fullTranscript,
      callStartTime,
      agentId: resolvedAgentId,
      callerNumber: callerInfo.phone,
      userId: agentObj?.userId,
      logPrefix: 'Plivo',
      audioBuffer: recorder.getBuffer(),
      sampleRate: 8000,
    });
  };

  plivoWs.on('message', async (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.event === 'start') {
      streamId = msg.streamId || `plivo_stream_${Date.now()}`;
      callUuid = msg.callUUID || msg.callUuid || `plivo_${Date.now()}`;
      log.info('plivo_stream_started', { streamId, callUuid });

      let callerNumber = msg.from || msg.caller || 'Unknown';
      let calledNumber = msg.to || '';

      if (!resolvedAgentId || !mongoose.Types.ObjectId.isValid(resolvedAgentId)) {
        if (calledNumber) {
          const match = await Agent.findOne({ phoneNumber: calledNumber, isActive: true });
          if (match) resolvedAgentId = match._id.toString();
        }
      }

      if (resolvedAgentId) {
        agentObj = await Agent.findById(resolvedAgentId);
      }

      if (!agentObj) {
        log.warn('plivo_agent_not_found', { resolvedAgentId });
        plivoWs.close();
        return;
      }

      agentRegistered = true;
      callManager.register(resolvedAgentId);

      const preCallContext = await fetchPreCallContext({
        callerNumber,
        agentObj,
      });

      const initialGreeting = await generateGreeting({
        agentObj,
        callerInfo: { name: preCallContext.name, phone: callerNumber, ...preCallContext.extractedVariables },
      });

      if (initialGreeting && plivoWs.readyState === WebSocket.OPEN) {
        conversationHistory.push({ role: 'assistant', content: initialGreeting });
        fullTranscript += `Agent: ${initialGreeting}\n`;
        const base64Audio = await cachedSynthesizeSpeech(
          initialGreeting,
          true,
          agentObj.language || 'en',
          agentObj.voiceId,
          { speed: agentObj.voiceSpeed, customBaseUrl: agentObj.customTtsBaseUrl }
        );

        if (base64Audio && plivoWs.readyState === WebSocket.OPEN) {
          plivoWs.send(JSON.stringify({
            event: 'playAudio',
            media: { payload: base64Audio },
          }));
        }
      }

      deepgramWs = createDeepgramSTT({
        logPrefix: 'Plivo',
        sampleRate: 8000,
        encoding: 'mulaw',
        onTranscript: async (text) => {
          if (!text || text.trim().length === 0) return;
          log.info('plivo_caller_transcript', { text });
          fullTranscript += `Caller: ${text}\n`;
          conversationHistory.push({ role: 'user', content: text });

          conversationGraph.evaluateTransition({ userMessage: text });

          isInterrupted = false;
          isProcessing = true;

          const activeSystemPrompt = conversationGraph.buildNodePrompt({
            globalPrompt: agentObj.prompt || '',
            context: {
              company: agentObj.name,
              callerName: preCallContext.name || '',
              phone: callerNumber,
              ...preCallContext.extractedVariables,
            },
          });

          const messages = [
            { role: 'system', content: activeSystemPrompt },
            ...conversationHistory,
          ];

          try {
            const { stream, tools } = await generateCompletion({
              groq,
              openaiClient,
              gemini,
              conversationHistory: messages,
              agentType: agentObj.type,
              agentObj,
              logPrefix: 'Plivo LLM',
              toolState: toolAlreadyExecuted,
            });

            const { fullResponseText, toolCalls } = await processStream({
              stream,
              isInterrupted: false,
              onSentence: async (sentence) => {
                if (isInterrupted) return;
                const audio = await cachedSynthesizeSpeech(
                  sentence,
                  true,
                  agentObj.language || 'en',
                  agentObj.voiceId,
                  { speed: agentObj.voiceSpeed, customBaseUrl: agentObj.customTtsBaseUrl }
                );
                if (audio && !isInterrupted && plivoWs.readyState === WebSocket.OPEN) {
                  plivoWs.send(JSON.stringify({
                    event: 'playAudio',
                    media: { payload: audio },
                  }));
                }
              },
            });

            if (fullResponseText) {
              conversationHistory.push({ role: 'assistant', content: fullResponseText });
              fullTranscript += `Agent: ${fullResponseText}\n`;
            }

            if (toolCalls.length > 0) {
              await executeToolCalls({
                toolCalls,
                agentObj,
                toolAlreadyExecuted,
                conversationHistory,
                logPrefix: 'Plivo Tool',
                callId: callUuid,
              });
            }
          } catch (err) {
            log.error('plivo_llm_processing_failed', { error: err.message });
          } finally {
            isProcessing = false;
          }
        },
      });

      callTimeout = setTimeout(() => {
        runCleanup();
        if (plivoWs.readyState === WebSocket.OPEN) plivoWs.close();
      }, MAX_CALL_DURATION_MS);
    }

    if (msg.event === 'media' && msg.media?.payload) {
      if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
        const buf = Buffer.from(msg.media.payload, 'base64');
        deepgramWs.send(buf);
        recorder.writeAudio(buf, Date.now(), 8000);
      }
    }

    if (msg.event === 'dtmf') {
      const digit = msg.dtmf?.digit || msg.digit;
      if (digit) {
        log.info('plivo_dtmf_digit_received', { digit, streamId });
        fullTranscript += `Caller (Keypad): [Pressed ${digit}]\n`;
        conversationHistory.push({ role: 'user', content: `[Keypad input: ${digit}]` });
      }
    }

    if (msg.event === 'stop') {
      log.info('plivo_stream_stopped', { streamId });
      runCleanup();
    }
  });

  plivoWs.on('close', () => {
    log.info('plivo_stream_closed');
    runCleanup();
  });

  plivoWs.on('error', (err) => {
    log.error('plivo_stream_error', { error: err.message });
    runCleanup();
  });
}
