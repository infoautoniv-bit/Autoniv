import WebSocket from 'ws';
import { synthesizeSpeech } from '../speech/tts.js';
import { LANGUAGE_NAMES } from '../speech/translate.js';
import { AudioRecorder } from '../audioRecorder.js';
import { log } from '../logger.js';
import {
  createDeepgramSTT,
  getSharedLLM,
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

export class BaseVoiceHandler {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 8000;
    this.audioEncoding = options.encoding || 'linear16';
    this.logPrefix = options.logPrefix || 'Base Voice';

    this.streamSid = null;
    this.callSid = null;
    this.agentObj = null;
    this.conversationHistory = [];
    this.fullTranscript = '';
    this.callStartTime = new Date();
    this.deepgramWs = null;

    this.isInterrupted = false;
    this.isProcessing = false;

    // Per-session isolated tool execution state
    this.toolAlreadyExecuted = {
      saveAppointment: false,
      saveLead: false,
      logComplaint: false,
      pendingLeadData: null,
    };
    this.callerInfo = { name: null, phone: null, email: null };
    this.pendingUtterance = null;

    this.cleanedUp = false;
    this.callTimeout = null;
    this.timeLimitReached = false;
    this.muteInputUntil = 0;
    this.echoTailMs = options.echoTailMs || 600;

    this.traceId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.metrics = {
      turnCount: 0,
      totalLlmMs: 0,
      totalToolMs: 0,
      startTimestamp: Date.now(),
    };

    this.recorder = new AudioRecorder(this.sampleRate);
  }

  // --- Abstract / Transport Specific Methods (To be overridden by subclasses) ---
  isTransportOpen() {
    return false;
  }

  sendAudioPayload(base64Audio, audioBuffer) {
    throw new Error('sendAudioPayload must be implemented by subclass');
  }

  sendClearSignal() {
    throw new Error('sendClearSignal must be implemented by subclass');
  }

  sendTranscriptMessage(role, text) {
    // Optional implementation for transports supporting client-side live transcript events
  }

  closeTransport(code = 1000, reason = 'Call ended') {
    // Optional implementation for subclass transport closing
  }

  // --- Shared Core Pipeline Logic ---
  triggerInterruption() {
    if (this.isInterrupted) return;
    this.isInterrupted = true;
    this.muteInputUntil = 0;
    log.info(`${this.logPrefix}_interruption`, { traceId: this.traceId, message: 'Caller barged in — stopping agent playback (<50ms VAD).' });
    if (this.isTransportOpen()) {
      try {
        this.sendClearSignal();
      } catch (err) {
        log.warn(`${this.logPrefix}_clear_signal_failed`, { traceId: this.traceId, error: err.message });
      }
    }
  }

  extractCallerInfo(text) {
    extractCallerInfoShared(text, this.callerInfo);
  }

  injectCallerContext() {
    injectCallerContextShared(this.conversationHistory, this.callerInfo);
  }

  async handleUserUtterance(userInputText) {
    this.isInterrupted = false;
    this.metrics.turnCount++;
    log.info(`${this.logPrefix}_user_utterance`, { traceId: this.traceId, turn: this.metrics.turnCount, text: userInputText });

    this.extractCallerInfo(userInputText);
    this.conversationHistory.push({ role: 'user', content: userInputText });
    this.injectCallerContext();

    if (this.isProcessing) {
      this.pendingUtterance = userInputText;
      return;
    }
    await this.executeCompletionFlow();
  }

  async processSentenceForPlay(sentence) {
    if (this.isInterrupted) return;
    try {
      const isMulaw = this.audioEncoding === 'mulaw';
      let ttsOption = isMulaw ? true : { encoding: this.audioEncoding, sampleRate: this.sampleRate };

      const base64Audio = await synthesizeSpeech(sentence, ttsOption, this.agentObj?.language || 'en', this.agentObj?.voiceId);

      if (base64Audio && !this.isInterrupted && this.isTransportOpen()) {
        const agentAudio = Buffer.from(base64Audio, 'base64');
        if (isMulaw) {
          this.recorder.writeMulaw8k(agentAudio, Date.now());
          const playbackMs = agentAudio.length / 8;
          this.muteInputUntil = Math.max(this.muteInputUntil, Date.now() + playbackMs + this.echoTailMs);
        } else {
          this.recorder.writeAudio(agentAudio, Date.now(), this.sampleRate);
        }
        this.sendAudioPayload(base64Audio, agentAudio);
      }
    } catch (err) {
      log.error('tts_synthesis_failed', { traceId: this.traceId, prefix: this.logPrefix, error: err.message });
    }
  }

  async executeCompletionFlow() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    const llmStartTime = Date.now();
    const LLM_STREAM_TIMEOUT_MS = 15000;

    try {
      const llmClients = getSharedLLM();
      const completionPromise = generateCompletion({
        ...llmClients,
        conversationHistory: this.conversationHistory,
        agentType: this.agentObj?.type,
        logPrefix: `${this.logPrefix} LLM`,
        toolState: this.toolAlreadyExecuted,
        agentObj: this.agentObj,
        traceId: this.traceId,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('LLM stream timeout')), LLM_STREAM_TIMEOUT_MS);
      });

      const { stream } = await Promise.race([completionPromise, timeoutPromise]);

      const streamPromise = processStream({
        stream,
        checkInterrupted: () => this.isInterrupted,
        onSentence: (sentence) => this.processSentenceForPlay(sentence),
      });

      const streamTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('LLM response timeout')), LLM_STREAM_TIMEOUT_MS);
      });

      const { fullResponseText, toolCalls, interrupted } = await Promise.race([streamPromise, streamTimeoutPromise]);

      const llmDuration = Date.now() - llmStartTime;
      this.metrics.totalLlmMs += llmDuration;
      log.info(`${this.logPrefix}_llm_latency`, { traceId: this.traceId, llmMs: llmDuration });

      if (interrupted) return;

      if (fullResponseText || toolCalls.length > 0) {
        const assistantMsg = { role: 'assistant' };
        if (fullResponseText) {
          assistantMsg.content = fullResponseText;
          this.fullTranscript += `Agent: ${fullResponseText}\n`;
          this.sendTranscriptMessage('agent', fullResponseText);
        } else {
          assistantMsg.content = null;
        }

        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          }));
        }
        this.conversationHistory.push(assistantMsg);
      }

      if (toolCalls.length > 0 && !this.isInterrupted) {
        const toolStartTime = Date.now();
        await executeToolCalls({
          toolCalls,
          agentObj: this.agentObj,
          toolAlreadyExecuted: this.toolAlreadyExecuted,
          conversationHistory: this.conversationHistory,
          logPrefix: `${this.logPrefix} Tool`,
          callId: this.callSid,
          traceId: this.traceId,
        });
        const toolDuration = Date.now() - toolStartTime;
        this.metrics.totalToolMs += toolDuration;
        log.info(`${this.logPrefix}_tool_latency`, { traceId: this.traceId, toolMs: toolDuration });

        this.isProcessing = false;
        await this.executeCompletionFlow();
        return;
      }
    } catch (err) {
      log.error(`${this.logPrefix}_completion_flow_error`, { traceId: this.traceId, error: err.message });
      if (!this.isInterrupted) {
        try {
          await this.processSentenceForPlay('Sorry, I missed that. Could you say it again?');
        } catch (_) {}
      }
    } finally {
      this.isProcessing = false;

      if (this.pendingUtterance && !this.isInterrupted) {
        const nextUtterance = this.pendingUtterance;
        this.pendingUtterance = null;
        await this.handleUserUtterance(nextUtterance);
      }
    }
  }

  async setupSTTAndGreeting(systemInstructions) {
    try {
      this.deepgramWs = await createDeepgramSTT({
        agentObj: this.agentObj,
        encoding: this.audioEncoding,
        sampleRate: this.sampleRate,
        logPrefix: `${this.logPrefix} STT`,
        onTranscript: (text) => {
          this.fullTranscript += `Caller: ${text}\n`;
          this.sendTranscriptMessage('caller', text);
          this.handleUserUtterance(text);
        },
        onInterruption: () => this.triggerInterruption(),
      });
    } catch (sttErr) {
      log.error('deepgram_stt_init_failed', { traceId: this.traceId, prefix: this.logPrefix, error: sttErr.message });
    }

    const llmClients = getSharedLLM();
    let greetingText = await generateGreeting({
      ...llmClients,
      systemInstructions,
      agentType: this.agentObj?.type || 'receptionist',
      agentObj: this.agentObj,
    });

    const result = await translateIfNeeded(systemInstructions, greetingText, this.agentObj?.language || 'en');
    systemInstructions = result.systemInstructions;
    greetingText = result.greetingText;

    this.conversationHistory.push({ role: 'system', content: systemInstructions });
    log.info(`${this.logPrefix}_greeting`, { traceId: this.traceId, greeting: greetingText });
    this.conversationHistory.push({ role: 'assistant', content: greetingText });
    this.fullTranscript += `Agent: ${greetingText}\n`;

    this.sendTranscriptMessage('agent', greetingText);

    this.isProcessing = true;
    try {
      await this.processSentenceForPlay(greetingText);
    } finally {
      this.isProcessing = false;
    }

    this.callTimeout = setTimeout(() => this.endCallOnTimeLimit(), MAX_CALL_DURATION_MS);
  }

  buildSystemPromptInstructions(ownerUser) {
    let systemInstructions = buildSystemPrompt(this.agentObj?.type || 'receptionist', this.agentObj?.prompt);
    log.info(`${this.logPrefix}_system_prompt_source`, {
      traceId: this.traceId,
      agentId: this.agentObj?._id,
      hasCustomPrompt: Boolean(this.agentObj?.prompt),
      promptLength: this.agentObj?.prompt?.length || 0,
      promptPreview: this.agentObj?.prompt ? this.agentObj.prompt.substring(0, 100) : 'DEFAULT',
      agentType: this.agentObj?.type,
    });
    if (ownerUser) systemInstructions = interpolatePrompt(systemInstructions, ownerUser);
    if ((this.agentObj?.type || 'receptionist') === 'appointment') systemInstructions += APPOINTMENT_BOOKING_RULES;
    systemInstructions += TIME_LIMIT_RULES;
    systemInstructions += CALLER_MEMORY_RULES;
    systemInstructions += SYSTEM_SAFETY_GUARDRAILS;
    systemInstructions += HUMAN_VOICE_CADENCE_RULES;

    const agentLangName = LANGUAGE_NAMES[this.agentObj?.language || 'en'] || 'English';
    systemInstructions += `\n\nMULTILINGUAL & HUMAN SPEECH RULES:
1. You must respond in the same language that the user is speaking. If the user speaks or switches to another language (such as English, Hindi, Spanish, French, etc.), you MUST switch and reply in that language directly. Your default/starting language is ${agentLangName}.
2. Speak exactly like a natural, warm, and friendly human. Never sound robotic, and never output lists, tables, or bullet points.
3. When speaking in Hindi, use natural, conversational Hindi phrasing. Never write dates or times using spelled-out English words (e.g., do NOT say "twenty sixth july" or "four baje"). Instead, write them in standard digits or native Hindi words (e.g., say "26 जुलाई 2026" or "छब्बीस जुलाई" and "4 बजे" or "चार बजे"). Keep numbers and dates in standard format so the voice engine pronounces them naturally like a human.`;

    return systemInstructions;
  }

  async endCallOnTimeLimit() {
    if (this.timeLimitReached || this.cleanedUp) return;
    this.timeLimitReached = true;
    log.info(`${this.logPrefix}_call_time_limit_reached`, { traceId: this.traceId });

    this.isInterrupted = true;
    if (this.isTransportOpen()) {
      try {
        this.sendClearSignal();
      } catch (_) {}
    }
    this.isInterrupted = false;

    this.sendTranscriptMessage('agent', TIME_LIMIT_CLOSING);
    try {
      await this.processSentenceForPlay(TIME_LIMIT_CLOSING);
    } catch (_) {}

    setTimeout(() => {
      try {
        this.closeTransport(1000, 'Time limit reached');
      } catch (_) {}
      this.runCleanup();
    }, 4000);
  }

  async runCleanup() {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    const durationTotalMs = Date.now() - this.metrics.startTimestamp;

    log.info(`${this.logPrefix}_session_summary`, {
      traceId: this.traceId,
      callSid: this.callSid,
      durationMs: durationTotalMs,
      turns: this.metrics.turnCount,
      llmMs: this.metrics.totalLlmMs,
      toolMs: this.metrics.totalToolMs,
    });

    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }

    await closeAndCleanup({
      callSid: this.callSid,
      agentObj: this.agentObj,
      callStartTime: this.callStartTime,
      fullTranscript: this.fullTranscript,
      deepgramWs: this.deepgramWs,
      pendingLeadData: this.toolAlreadyExecuted.pendingLeadData,
      recorder: this.recorder,
    });
  }
}
