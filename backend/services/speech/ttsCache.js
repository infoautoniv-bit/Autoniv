import { synthesizeSpeech } from './tts.js';
import { log } from '../logger.js';

class TTSCache {
  constructor(maxSize = 500, ttlMs = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.hits = 0;
    this.misses = 0;
  }

  getKey(text, telephonyOrFormat, language, voiceId) {
    return `${text}|${telephonyOrFormat}|${language}|${voiceId || 'default'}`;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.audio;
  }

  set(key, audio) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { audio, timestamp: Date.now() });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

const ttsCache = new TTSCache(500, 3600000);

const COMMON_PHRASES = [
  'hello', 'hi', 'thank you', 'goodbye', 'bye',
  'how can i help you', 'please hold', 'one moment',
  'sorry', 'i understand', 'let me check',
  'could you please repeat that', 'is there anything else',
];

export async function cachedSynthesizeSpeech(text, telephonyOrFormat = true, language = 'en', voiceId = null) {
  const key = ttsCache.getKey(text, telephonyOrFormat, language, voiceId);
  
  const cached = ttsCache.get(key);
  if (cached) {
    log.info('tts_cache_hit', { textLength: text.length, textPreview: text.substring(0, 30) });
    return cached;
  }

  const audio = await synthesizeSpeech(text, telephonyOrFormat, language, voiceId);
  
  const isCommon = COMMON_PHRASES.some(p => text.toLowerCase().includes(p));
  if (isCommon || text.length < 100) {
    ttsCache.set(key, audio);
  }

  return audio;
}

export function getTTSCacheStats() {
  return ttsCache.getStats();
}

export function clearTTSCache() {
  ttsCache.clear();
}
