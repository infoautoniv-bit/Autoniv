import { detectLanguageOfText, humanizeSpeechText } from '../services/speech/tts.js';
import { cachedSynthesizeSpeech, getTTSCacheStats, clearTTSCache } from '../services/speech/ttsCache.js';

describe('TTS & Voice Model Configurations', () => {
  beforeEach(() => {
    clearTTSCache();
  });

  it('detects language correctly for various scripts', () => {
    expect(detectLanguageOfText('नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?')).toBe('hi');
    expect(detectLanguageOfText('வணக்கம், உங்களுக்கு எப்படி உதவ முடியும்?')).toBe('ta');
    expect(detectLanguageOfText('Hello, how can I help you today?')).toBe('en');
    expect(detectLanguageOfText('Hola, ¿cómo puedo ayudarte hoy?')).toBe('es');
    expect(detectLanguageOfText('Bonjour, comment puis-je vous aider?')).toBe('fr');
  });

  it('humanizes abbreviations, time formats, and symbols for natural voice synthesis', () => {
    const raw = 'Dr. Sharma has an Appt. at 10:30 AM for Rs. 500 & 15% discount';
    const humanized = humanizeSpeechText(raw);
    expect(humanized).toContain('Doctor Sharma');
    expect(humanized).toContain('appointment');
    expect(humanized).toContain('10 30 A M');
    expect(humanized).toContain('Rupees 500');
    expect(humanized).toContain('and 15 percent discount');
  });

  it('maintains and updates TTS cache with speed and custom options', () => {
    const statsInitial = getTTSCacheStats();
    expect(statsInitial.hits).toBe(0);
    expect(statsInitial.size).toBe(0);
  });
});
