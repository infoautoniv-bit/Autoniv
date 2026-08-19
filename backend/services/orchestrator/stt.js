import WebSocket from 'ws';
import { log } from '../logger.js';

const LANGUAGE_MAP = {
  en: 'en-IN',
  hi: 'hi',
  ta: 'ta',
  te: 'te',
  bn: 'bn',
  gu: 'gu',
  kn: 'kn',
  ml: 'ml',
  mr: 'mr',
  pa: 'pa',
  or: 'or',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  pl: 'pl',
  ar: 'ar',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh',
  nl: 'nl',
  ru: 'ru',
  tr: 'tr',
};

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
    this.utteranceBuffer = '';
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

        // Handle UtteranceEnd event from Deepgram
        if (response.type === 'UtteranceEnd') {
          if (this.utteranceBuffer && this.utteranceBuffer.trim().length > 0) {
            const finalUtterance = this.utteranceBuffer.trim();
            this.utteranceBuffer = '';
            if (finalUtterance !== this.lastProcessedTranscript) {
              this.lastProcessedTranscript = finalUtterance;
              log.info('stt_utterance_end_final', { prefix: this.logPrefix, transcript: finalUtterance });
              this.onTranscript(finalUtterance, true);
            }
          }
          return;
        }

        const transcript = response.channel?.alternatives?.[0]?.transcript;
        const isFinal = response.is_final;
        const isSpeechFinal = response.speech_final;

        if (transcript && transcript.trim().length >= 2) {
          if (isFinal) {
            if (isSpeechFinal) {
              const fullText = (this.utteranceBuffer ? (this.utteranceBuffer + ' ' + transcript) : transcript).trim();
              this.utteranceBuffer = '';
              if (fullText === this.lastProcessedTranscript) return;
              this.lastProcessedTranscript = fullText;
              log.info('stt_speech_final', { prefix: this.logPrefix, transcript: fullText });
              this.onTranscript(fullText, true);
            } else {
              // Accumulate in buffer until speech finishes
              this.utteranceBuffer = (this.utteranceBuffer ? (this.utteranceBuffer + ' ' + transcript) : transcript).trim();
            }
          } else if (this.onInterruption) {
            // Only trigger interruption when actual speech words are detected (not ambient background noise)
            const cleanWords = transcript.trim();
            if (cleanWords.length >= 3 && !/^[.,?!]+$/.test(cleanWords)) {
              this.onInterruption();
            }
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
      } catch (err) { }
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

export function createGladiaSTT({ agentObj, encoding, sampleRate, logPrefix, onTranscript, onInterruption }) {
  const gladiaKey = process.env.GLADIA_API_KEY;
  if (!gladiaKey || gladiaKey.startsWith('your-')) {
    return Promise.reject(new Error('GLADIA_API_KEY is not set'));
  }

  const gladiaUrl = `wss://api.gladia.io/v2/live`;
  const ws = new WebSocket(gladiaUrl, {
    headers: { 'x-gladia-key': gladiaKey },
  });

  return new Promise((resolve, reject) => {
    let resolved = false;

    ws.on('open', () => {
      log.info('gladia_stt_connected', { prefix: logPrefix });
      // Send Gladia v2 live session initialization
      ws.send(JSON.stringify({
        action: 'start_session',
        data: {
          sample_rate: sampleRate,
          encoding: encoding === 'mulaw' ? 'audio/x-mulaw' : 'audio/x-raw',
          language_config: {
            languages: [agentObj?.language || 'en'],
            code_switching: true,
          },
        },
      }));
      resolved = true;
      resolve({
        send: (data) => {
          if (ws.readyState === WebSocket.OPEN) {
            // Gladia expects chunk payloads
            ws.send(JSON.stringify({ action: 'audio_chunk', data: { chunk: data.toString('base64') } }));
          }
        },
        close: () => {
          try { ws.close(); } catch (_) {}
        },
      });
    });

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'transcript' && data.data?.utterance?.text) {
          const text = data.data.utterance.text.trim();
          if (text) {
            if (data.data.is_final) {
              onTranscript(text, true);
            } else if (onInterruption) {
              onInterruption();
            }
          }
        }
      } catch (err) {
        log.error('gladia_parse_error', { prefix: logPrefix, error: err.message });
      }
    });

    ws.on('error', (err) => {
      log.error('gladia_stt_error', { prefix: logPrefix, error: err.message });
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });
  });
}

export async function transcribeWithWhisper(audioBuffer, language = 'en') {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  try {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-large-v3-turbo');
    if (language) formData.append('language', language);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
      },
      body: formData,
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json.text || null;
  } catch (err) {
    log.warn('whisper_transcription_failed', { error: err.message });
    return null;
  }
}

export function createDeepgramSTT({ agentObj, encoding, sampleRate, logPrefix, onTranscript, onInterruption }) {
  // If Gladia is explicitly configured on the agent
  if (agentObj?.sttProvider === 'gladia' && process.env.GLADIA_API_KEY) {
    return createGladiaSTT({ agentObj, encoding, sampleRate, logPrefix, onTranscript, onInterruption });
  }

  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramKey || deepgramKey.startsWith('your-')) {
    // If Gladia is available as fallback
    if (process.env.GLADIA_API_KEY) {
      return createGladiaSTT({ agentObj, encoding, sampleRate, logPrefix, onTranscript, onInterruption });
    }
    return Promise.reject(new Error('DEEPGRAM_API_KEY is not set'));
  }

  const langCode = getLangCode(agentObj?.language || 'en');
  const deepgramUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=${langCode}&encoding=${encoding}&sample_rate=${sampleRate}&interim_results=true&endpointing=500&utterance_end_ms=1200&vad_events=true&smart_format=true&keywords=Autoniv:2,Ava:2,appointment:2,pricing:2,booking:2,support:2`;

  const wrapper = new ReconnectingDeepgramWS(
    deepgramUrl,
    { headers: { 'Authorization': `Token ${deepgramKey}` } },
    logPrefix,
    onTranscript,
    onInterruption
  );

  return wrapper.connect().then(() => wrapper);
}
