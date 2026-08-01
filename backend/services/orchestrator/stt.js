import WebSocket from 'ws';
import { log } from '../logger.js';

const LANGUAGE_MAP = {
  en: 'en-IN', hi: 'hi', ta: 'ta', te: 'te',
  bn: 'bn', gu: 'gu', kn: 'kn', ml: 'ml',
  mr: 'mr', pa: 'pa', or: 'or',
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
