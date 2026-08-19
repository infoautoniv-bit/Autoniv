/**
 * Asterisk ARI (Asterisk REST Interface) External Media Stream Handler
 * Enables bidirectional audio streaming for on-premise Asterisk PBX & FreePBX systems.
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

export function handleAsteriskStream(asteriskWs, urlAgentId) {
  log.info('asterisk_ari_stream_connected');

  let channelId = `ari_${Date.now()}`;
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
      callSid: channelId,
      fullTranscript,
      callStartTime,
      agentId: resolvedAgentId,
      callerNumber: callerInfo.phone,
      userId: agentObj?.userId,
      logPrefix: 'AsteriskARI',
      audioBuffer: recorder.getBuffer(),
      sampleRate: 8000,
    });
  };

  const initializeSession = async () => {
    if (resolvedAgentId && mongoose.Types.ObjectId.isValid(resolvedAgentId)) {
      agentObj = await Agent.findById(resolvedAgentId);
    }

    if (!agentObj) {
      log.warn('asterisk_agent_not_found', { resolvedAgentId });
      asteriskWs.close();
      return;
    }

    agentRegistered = true;
    callManager.register(resolvedAgentId);

    const preCallContext = await fetchPreCallContext({
      callerNumber: 'PBX Caller',
      agentObj,
    });

    const initialGreeting = await generateGreeting({
      agentObj,
      callerInfo: { name: preCallContext.name, phone: 'PBX Caller', ...preCallContext.extractedVariables },
    });

    if (initialGreeting && asteriskWs.readyState === WebSocket.OPEN) {
      conversationHistory.push({ role: 'assistant', content: initialGreeting });
      fullTranscript += `Agent: ${initialGreeting}\n`;
      const base64Audio = await cachedSynthesizeSpeech(
        initialGreeting,
        true,
        agentObj.language || 'en',
        agentObj.voiceId,
        { speed: agentObj.voiceSpeed, customBaseUrl: agentObj.customTtsBaseUrl }
      );

      if (base64Audio && asteriskWs.readyState === WebSocket.OPEN) {
        const rawBuf = Buffer.from(base64Audio, 'base64');
        asteriskWs.send(rawBuf);
      }
    }

    deepgramWs = createDeepgramSTT({
      logPrefix: 'AsteriskARI',
      sampleRate: 8000,
      encoding: 'mulaw',
      onTranscript: async (text) => {
        if (!text || text.trim().length === 0) return;
        log.info('asterisk_caller_transcript', { text });
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
            phone: 'PBX Caller',
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
            logPrefix: 'Asterisk LLM',
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
              if (audio && !isInterrupted && asteriskWs.readyState === WebSocket.OPEN) {
                const rawBuf = Buffer.from(audio, 'base64');
                asteriskWs.send(rawBuf);
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
              logPrefix: 'Asterisk Tool',
              callId: channelId,
            });
          }
        } catch (err) {
          log.error('asterisk_llm_processing_failed', { error: err.message });
        } finally {
          isProcessing = false;
        }
      },
    });

    callTimeout = setTimeout(() => {
      runCleanup();
      if (asteriskWs.readyState === WebSocket.OPEN) asteriskWs.close();
    }, MAX_CALL_DURATION_MS);
  };

  initializeSession();

  asteriskWs.on('message', (data) => {
    // Asterisk external media streams binary raw audio frames
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
      deepgramWs.send(buf);
      recorder.writeAudio(buf, Date.now(), 8000);
    }
  });

  asteriskWs.on('close', () => {
    log.info('asterisk_stream_closed');
    runCleanup();
  });

  asteriskWs.on('error', (err) => {
    log.error('asterisk_stream_error', { error: err.message });
    runCleanup();
  });
}
