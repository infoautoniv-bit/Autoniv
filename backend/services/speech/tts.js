import WebSocket from 'ws';
import { log } from '../logger.js';

function addWavHeader(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function synthesizeSpeechDirectDeepgram(text, fmt, modelName) {
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramKey || deepgramKey.startsWith('your-')) {
    throw new Error('DEEPGRAM_API_KEY is not set or is a placeholder');
  }
  const encoding = fmt.encoding || 'mulaw';
  const sampleRate = fmt.sampleRate || 8000;
  const format = `encoding=${encoding}&sample_rate=${sampleRate}`;
  const container = fmt.isTelephony ? 'container=none' : 'container=wav';
  const url = `https://api.deepgram.com/v1/speak?model=${modelName}&${format}&${container}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${deepgramKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const errTxt = await response.text();
    throw new Error(`Deepgram TTS fallback failed (${response.status}): ${errTxt}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

async function synthesizeSpeechCartesia(text, fmt, voiceId = 'a0e99841-438c-4a64-b679-ae501e7d6091', options = {}) {
  const cartesiaKey = process.env.CARTESIA_API_KEY;
  if (!cartesiaKey || cartesiaKey.startsWith('your-')) {
    throw new Error('CARTESIA_API_KEY is not configured or is placeholder');
  }
  const isTelephony = fmt.encoding === 'mulaw' || fmt.encoding === 'ulaw';
  const encoding = isTelephony ? 'pcm_mulaw' : 'pcm_s16le';
  const sampleRate = isTelephony ? 8000 : (fmt.sampleRate || 24000);

  const response = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'X-API-Key': cartesiaKey,
      'Cartesia-Version': '2024-06-10',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: options.model || 'sonic-multilingual',
      transcript: text,
      voice: { mode: 'id', id: voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091' },
      output_format: {
        container: 'raw',
        encoding,
        sample_rate: sampleRate,
      },
      duration_scale: options.speed ? 1.0 / options.speed : 1.0,
    }),
  });

  if (!response.ok) {
    const errTxt = await response.text();
    throw new Error(`Cartesia TTS failed (${response.status}): ${errTxt}`);
  }

  const buffer = await response.arrayBuffer();
  const rawBuf = Buffer.from(buffer);
  if (!isTelephony) {
    const wavBuf = addWavHeader(rawBuf, sampleRate, 1, 16);
    return wavBuf.toString('base64');
  }
  return rawBuf.toString('base64');
}

async function synthesizeSpeechOpenAI(text, fmt, voice = 'alloy', options = {}) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const baseUrl = options.customBaseUrl || process.env.OPENAI_TTS_BASE_URL || 'https://api.openai.com/v1';
  if (!openaiKey && !options.customBaseUrl) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const speed = Math.min(2.0, Math.max(0.5, Number(options.speed) || 1.0));
  const isTelephony = fmt.encoding === 'mulaw' || fmt.encoding === 'ulaw';
  const responseFormat = isTelephony ? 'opus' : 'pcm';

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey || 'sk-local'}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'tts-1',
      input: text,
      voice: voice || 'alloy',
      response_format: responseFormat,
      speed,
    }),
  });

  if (!response.ok) {
    const errTxt = await response.text();
    throw new Error(`OpenAI TTS failed (${response.status}): ${errTxt}`);
  }

  const buffer = await response.arrayBuffer();
  const rawBuf = Buffer.from(buffer);
  if (!isTelephony && responseFormat === 'pcm') {
    const wavBuf = addWavHeader(rawBuf, 24000, 1, 16);
    return wavBuf.toString('base64');
  }
  return rawBuf.toString('base64');
}

async function synthesizeSpeechSmallestAI(text, fmt, voiceId = 'emily', options = {}) {
  const smallestKey = process.env.SMALLEST_API_KEY;
  if (!smallestKey || smallestKey.startsWith('your-')) {
    throw new Error('SMALLEST_API_KEY is not configured');
  }
  const speed = Number(options.speed) || 1.0;
  const isTelephony = fmt.encoding === 'mulaw' || fmt.encoding === 'ulaw';
  const sampleRate = isTelephony ? 8000 : 24000;

  const response = await fetch('https://waves-api.smallest.ai/api/v1/lightning/get_speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${smallestKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId || 'emily',
      speed,
      sample_rate: sampleRate,
      add_wav_header: !isTelephony,
    }),
  });

  if (!response.ok) {
    const errTxt = await response.text();
    throw new Error(`Smallest AI TTS failed (${response.status}): ${errTxt}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

const SARVAM_MALE_SPEAKERS = new Set([
  'shubh', 'aditya', 'rahul', 'rohan', 'amit', 'dev', 'ratan', 'varun', 'manan',
  'sumit', 'kabir', 'aayan', 'ashutosh', 'advait', 'anand', 'tarun', 'sunny',
  'mani', 'gokul', 'vijay', 'mohit', 'rehan', 'soham',
  'abhilash', 'karun', 'hitesh',
]);

function isSarvamMaleSpeaker(speaker) {
  return SARVAM_MALE_SPEAKERS.has(String(speaker || '').toLowerCase());
}

export function detectLanguageOfText(text, agentLanguage = 'en') {
  if (!text) return agentLanguage;

  if (/[\u0900-\u097F]/.test(text)) {
    return agentLanguage === 'mr' ? 'mr' : 'hi';
  }
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';

  const lowerText = text.toLowerCase();

  const hits = (words) => {
    let n = 0;
    for (const w of words) {
      if (new RegExp(`\\b${w}\\b`).test(lowerText) && ++n >= 2) return true;
    }
    return false;
  };

  if (/[¡¿ñáéíóúü]/.test(lowerText) || hits(['hola', 'gracias', 'buenos', 'dias', 'como', 'esta', 'adios', 'por', 'favor', 'señor', 'para'])) {
    return 'es';
  }
  if (/[œçàèùâêîôûëï]/.test(lowerText) || hits(['bonjour', 'merci', 'oui', 'comment', 'allez', 'tres', 'bien', 'plaît', 'pour', 'avec', 'vous'])) {
    return 'fr';
  }
  if (/[äöüß]/.test(lowerText) || hits(['hallo', 'danke', 'bitte', 'nein', 'wie', 'geht', 'und', 'ist'])) {
    return 'de';
  }
  if (/[àèéìòù]/.test(lowerText) || hits(['ciao', 'grazie', 'prego', 'come', 'sta', 'bene', 'per', 'con'])) {
    return 'it';
  }
  if (/[ãõçáéíóúâêô]/.test(lowerText) || hits(['olá', 'obrigado', 'sim', 'como', 'vai', 'bem', 'bom', 'dia'])) {
    return 'pt';
  }
  if (/[ąćęłńóśźż]/.test(lowerText) || hits(['dzień', 'dobry', 'dziękuję', 'proszę', 'tak', 'nie', 'jak', 'się', 'masz'])) {
    return 'pl';
  }
  if (/[çğıöşü]/.test(lowerText) || hits(['merhaba', 'teşekkürler', 'lütfen', 'evet', 'hayır', 'nasıl', 'iyi', 'bir', 'ile'])) {
    return 'tr';
  }
  if (hits(['hallo', 'bedankt', 'alsjeblieft', 'nee', 'hoe', 'gaat', 'het', 'een'])) {
    return 'nl';
  }

  return agentLanguage;
}

function getBestMultilingualProvider(detectedLang, gender) {
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  const sarvamKey = process.env.SARVAM_API_KEY;

  if (elevenlabsKey && !elevenlabsKey.startsWith('your-') && !elevenlabsKey.includes('placeholder')) {
    const voiceId = gender === 'male' ? 'cjVigY5qzO86Huf0OWal' : 'hpp4J3VqNfWAUOO0d1Us';
    return { provider: 'elevenlabs', voiceModelOrId: voiceId };
  }

  if (detectedLang === 'en' && deepgramKey && !deepgramKey.startsWith('your-')) {
    const voiceId = gender === 'male' ? 'aura-orion-en' : 'aura-asteria-en';
    return { provider: 'deepgram', voiceModelOrId: voiceId };
  }

  const sarvamSupported = ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'];
  if (sarvamKey && !sarvamKey.startsWith('your-') && sarvamSupported.includes(detectedLang)) {
    const voiceId = gender === 'male' ? 'shubh' : 'shreya';
    return { provider: 'sarvam', voiceModelOrId: voiceId };
  }

  const voiceId = gender === 'male' ? 'aura-orion-en' : 'aura-asteria-en';
  return { provider: 'deepgram', voiceModelOrId: voiceId };
}

function normalizeTelephonyFormat(fmt) {
  if (fmt && typeof fmt === 'object') {
    const enc = String(fmt.encoding || '').toLowerCase();
    const sr = Number(fmt.sampleRate) || 24000;
    return { encoding: enc || 'mulaw', sampleRate: sr, isTelephony: enc === 'mulaw' || enc === 'ulaw' };
  }
  if (typeof fmt === 'boolean') {
    return fmt
      ? { encoding: 'mulaw', sampleRate: 8000, isTelephony: true }
      : { encoding: 'linear16', sampleRate: 24000, isTelephony: false };
  }
  return { encoding: 'mulaw', sampleRate: 8000, isTelephony: true };
}

export function humanizeSpeechText(text) {
  if (!text || typeof text !== 'string') return text || '';

  let h = text;

  // 1. Expand common titles & abbreviations
  h = h.replace(/\bDr\.(?=\s|[A-Z])/gi, 'Doctor ');
  h = h.replace(/\bMr\.(?=\s|[A-Z])/gi, 'Mister ');
  h = h.replace(/\bMrs\.(?=\s|[A-Z])/gi, 'Missus ');
  h = h.replace(/\bMs\.(?=\s|[A-Z])/gi, 'Miss ');
  h = h.replace(/\bAppt\.?|\bapt\.?/gi, 'appointment');
  h = h.replace(/\bRs\.?|₹/gi, 'Rupees ');
  h = h.replace(/\bINR\b/g, 'Rupees');
  h = h.replace(/\bvs\.?/gi, 'versus');
  h = h.replace(/\be\.g\.?/gi, 'for example');
  h = h.replace(/\bi\.e\.?/gi, 'that is');
  h = h.replace(/\betc\.?/gi, 'et cetera');
  h = h.replace(/\bapprox\.?/gi, 'approximately');
  h = h.replace(/\bw\/o\b/gi, 'without');
  h = h.replace(/\bw\//gi, 'with ');

  // 2. Expand units & symbols
  h = h.replace(/%/g, ' percent');
  h = h.replace(/&/g, ' and ');
  h = h.replace(/\bmin\b|\bmins\b|\bmin\./gi, ' minutes');
  h = h.replace(/\bsec\b|\bsecs\b|\bsec\./gi, ' seconds');
  h = h.replace(/\bhr\b|\bhrs\b|\bhr\./gi, ' hours');
  h = h.replace(/\bms\b/gi, ' milliseconds');
  h = h.replace(/\bp\.a\./gi, ' per annum');

  // 3. Technical acronyms spelled out with clear character breaks for speech engines
  h = h.replace(/\bCOD\b/g, 'C O D');
  h = h.replace(/\bEMI\b/g, 'E M I');
  h = h.replace(/\bCRM\b/g, 'C R M');
  h = h.replace(/\bHIPAA\b/g, 'Hippa');
  h = h.replace(/\bCSAT\b/g, 'Customer Satisfaction');
  h = h.replace(/\bOTP\b/g, 'O T P');
  h = h.replace(/\bKYC\b/g, 'K Y C');
  h = h.replace(/\bSMS\b/g, 'S M S');

  // 4. Time format: e.g. "10:30 AM" -> "10 30 A M"
  h = h.replace(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/g, (match, p1, p2, p3) => {
    return `${p1} ${p2} ${p3.toUpperCase().split('').join(' ')}`;
  });
  h = h.replace(/\b(AM|PM)\b/gi, (m) => m.toUpperCase().split('').join(' '));

  // 5. Conversational pauses: Replace abrupt em-dashes and dashes with soft commas
  h = h.replace(/—|--/g, ', ');
  h = h.replace(/;\s*/g, ', ');

  return h.replace(/\s+/g, ' ').trim();
}

export async function synthesizeSpeech(text, telephonyOrFormat = true, language = 'en', voiceId = null, options = {}) {
  const speechText = humanizeSpeechText(text);
  const fmt = normalizeTelephonyFormat(telephonyOrFormat);
  const isTwilio = fmt.isTelephony;
  let provider = null;
  let voiceModelOrId = voiceId;

  if (voiceId && voiceId.includes(':')) {
    const parts = voiceId.split(':');
    provider = parts[0];
    voiceModelOrId = parts.slice(1).join(':');
  } else if (voiceId) {
    if (voiceId.startsWith('aura-')) {
      provider = 'deepgram';
    } else if (voiceId.startsWith('bulbul')) {
      provider = 'sarvam';
    } else if (voiceId.startsWith('cartesia-') || voiceId.startsWith('sonic-')) {
      provider = 'cartesia';
      voiceModelOrId = voiceId.replace(/^(cartesia-|sonic-)/, '');
    } else if (voiceId.startsWith('openai:') || ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voiceId)) {
      provider = 'openai';
    } else {
      provider = 'elevenlabs';
    }
  } else {
    const detectedLang = detectLanguageOfText(speechText, language);
    const best = getBestMultilingualProvider(detectedLang, 'female');
    provider = best.provider;
    voiceModelOrId = best.voiceModelOrId;
  }

  // Handle Cartesia Sonic Provider
  if (provider === 'cartesia') {
    try {
      return await synthesizeSpeechCartesia(speechText, fmt, voiceModelOrId, options);
    } catch (cartesiaErr) {
      log.warn('tts_cartesia_failed_fallback_deepgram', { error: cartesiaErr.message });
      provider = 'deepgram';
      voiceModelOrId = 'aura-asteria-en';
    }
  }

  // Handle OpenAI / Speaches / Custom endpoint Provider
  if (provider === 'openai' || provider === 'custom') {
    try {
      return await synthesizeSpeechOpenAI(speechText, fmt, voiceModelOrId, options);
    } catch (openaiErr) {
      log.warn('tts_openai_failed_fallback_deepgram', { error: openaiErr.message });
      provider = 'deepgram';
      voiceModelOrId = 'aura-asteria-en';
    }
  }

  // Handle Smallest AI Waves Provider
  if (provider === 'smallest') {
    try {
      return await synthesizeSpeechSmallestAI(speechText, fmt, voiceModelOrId, options);
    } catch (smallestErr) {
      log.warn('tts_smallest_failed_fallback_deepgram', { error: smallestErr.message });
      provider = 'deepgram';
      voiceModelOrId = 'aura-asteria-en';
    }
  }

  const detectedLang = detectLanguageOfText(speechText, language);

  if (detectedLang !== language) {
    language = detectedLang;
    const isMale = /male|prabhat|guy|madhur|alvaro|henri|conrad|diego|antonio|marek|shakir|keita|injoon|yunxi|maarten|dmitry|ahmet|bashkar|mohan|valluvar|manohar|niranjan|gagan|midhun|gurpreet|ananya|zeus|orion|echo|fable|onyx|daniel|eric|chris|brian|adam|bill|shubh|manan|rohan|abhilash|karun|hitesh/i.test(voiceModelOrId || '');
    const gender = isMale ? 'male' : 'female';

    if (provider === 'deepgram') {
      if (detectedLang !== 'en') {
        const fallback = getBestMultilingualProvider(detectedLang, gender);
        provider = fallback.provider;
        voiceModelOrId = fallback.voiceModelOrId;
      }
    } else if (provider === 'sarvam') {
      const sarvamSupported = ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'];
      if (!sarvamSupported.includes(detectedLang)) {
        const fallback = getBestMultilingualProvider(detectedLang, gender);
        provider = fallback.provider;
        voiceModelOrId = fallback.voiceModelOrId;
      }
    }
  }

  if (!voiceModelOrId) {
    if (provider === 'elevenlabs') voiceModelOrId = 'hpp4J3VqNfWAUOO0d1Us';
    else if (provider === 'deepgram') voiceModelOrId = 'aura-asteria-en';
    else if (provider === 'sarvam') voiceModelOrId = 'bulbul:v3:shreya';
  }

  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const deepgramKey = process.env.DEEPGRAM_API_KEY;

  const isElevenLabsMissing = (!elevenlabsKey || elevenlabsKey.startsWith('your-') || elevenlabsKey.includes('placeholder'));
  const isDeepgramMissing = !deepgramKey || deepgramKey.startsWith('your-');

  if (provider === 'elevenlabs' && isElevenLabsMissing) {
    provider = 'deepgram';
  }

  if (provider === 'vapi') {
    const VAPI_11LABS = {
      Elliot: 'cjVigY5qzO86Huf0OWal',
      Savannah: 'hpp4J3VqNfWAUOO0d1Us',
      Rohan: 'TX3LPaxmHKxFdv7VOQHJ',
      Emma: 'cgSgspJ2msm6clMCkdW9',
      Clara: 'EXAVITQu4vr4xnSDxMaL',
      Nico: 'pNInz6obpgDQGcFmaJgB',
      Kai: 'bIHbv24MWmeRgasZH58o',
      Sagar: 'onwK4e9ZLuTAKqWW03F9',
      Godfrey: 'N2lVS1w4EtoT3dr4eOWO',
      Neil: 'iP95p4xoKVk53GoZ742B',
      Layla: 'Xb7hH8MSUJpSbSDYk0k2',
      Sid: 'nPczCjzI2devNBz1zQrb',
      Naina: 'XrExE9yKIg1WjnnlVkGX',
    };
    const VAPI_DEEPGRAM = {
      Elliot: 'aura-orion-en',
      Savannah: 'aura-asteria-en',
      Rohan: 'aura-zeus-en',
      Emma: 'aura-stella-en',
      Clara: 'aura-luna-en',
      Nico: 'aura-arcas-en',
      Kai: 'aura-helios-en',
      Sagar: 'aura-perseus-en',
      Godfrey: 'aura-angus-en',
      Neil: 'aura-orion-en',
      Layla: 'aura-athena-en',
      Sid: 'aura-zeus-en',
      Naina: 'aura-hera-en',
    };

    const vName = voiceModelOrId || 'Elliot';
    if (!isElevenLabsMissing && VAPI_11LABS[vName]) {
      provider = 'elevenlabs';
      voiceModelOrId = VAPI_11LABS[vName];
    } else {
      provider = 'deepgram';
      voiceModelOrId = VAPI_DEEPGRAM[vName] || 'aura-orion-en';
    }
  }

  if (provider === 'deepgram' && !isDeepgramMissing) {
    const fallbackVoice = (voiceModelOrId && (voiceModelOrId.includes('male') || voiceModelOrId.includes('orion') || voiceModelOrId.includes('zeus') || voiceModelOrId.includes('arcas'))) ? 'aura-orion-en' : (voiceModelOrId && voiceModelOrId.startsWith('aura-') ? voiceModelOrId : 'aura-asteria-en');
    return synthesizeSpeechDirectDeepgram(speechText, fmt, fallbackVoice);
  }

  if (provider === 'elevenlabs' && !isElevenLabsMissing) {
    try {
      const isTelephony = fmt.encoding === 'mulaw' || fmt.encoding === 'ulaw';
      const outputFormat = isTelephony ? 'ulaw_8000' : 'pcm_24000';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceModelOrId}?output_format=${outputFormat}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: speechText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.38,
            similarity_boost: 0.85,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        const errTxt = await response.text();
        throw new Error(`ElevenLabs TTS failed (${response.status}): ${errTxt}`);
      }

      const buffer = await response.arrayBuffer();
      let audioBuffer = Buffer.from(buffer);

      // If telephony mulaw was wrapped in a WAV header, strip the 44-byte header to prevent click/screech
      if (isTelephony) {
        if (audioBuffer.length > 44 && audioBuffer.toString('utf8', 0, 4) === 'RIFF') {
          audioBuffer = audioBuffer.subarray(44);
        }
        return audioBuffer.toString('base64');
      }

      // For web/linear16 audio, wrap raw 24kHz PCM with standard WAV header for clean browser playback
      const wavBuffer = addWavHeader(audioBuffer, 24000, 1, 16);
      return wavBuffer.toString('base64');
    } catch (elevenErr) {
      log.warn('tts_elevenlabs_failed_fallback_deepgram', { error: elevenErr.message });
      const fallbackVoice = (voiceModelOrId && voiceModelOrId.includes('male')) ? 'aura-orion-en' : 'aura-asteria-en';
      return synthesizeSpeechDirectDeepgram(speechText, fmt, fallbackVoice);
    }
  }

let sarvamQuotaExhausted = false;

  if (provider === 'sarvam') {
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey || sarvamKey.startsWith('your-') || sarvamQuotaExhausted) {
      const fallbackVoice = (voiceModelOrId && voiceModelOrId.includes('male')) ? 'aura-orion-en' : 'aura-asteria-en';
      return synthesizeSpeechDirectDeepgram(text, fmt, fallbackVoice);
    }

    const languageCodes = {
      en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', te: 'te-IN', ta: 'ta-IN',
      mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN',
    };

    if (!languageCodes[language]) {
      log.warn('tts_sarvam_unsupported_language_fallback', { language });
      const fallbackVoice = (voiceModelOrId && voiceModelOrId.includes('male')) ? 'aura-orion-en' : 'aura-asteria-en';
      return synthesizeSpeechDirectDeepgram(speechText, fmt, fallbackVoice);
    }

    const targetLangCode = languageCodes[language];
    const isTelephony = fmt.encoding === 'mulaw' || fmt.encoding === 'ulaw';
    const sampleRate = isTelephony ? 8000 : 16000;
    const outputCodec = isTelephony ? 'mulaw' : 'linear16';

    let sarvamModel = 'bulbul:v3';
    let speaker = 'shreya';

    if (voiceModelOrId) {
      if (voiceModelOrId.includes(':')) {
        const subparts = voiceModelOrId.split(':');
        speaker = subparts[subparts.length - 1];
      } else if (voiceModelOrId !== 'bulbul') {
        speaker = voiceModelOrId;
      }
    }

    const V3_SPEAKERS = ['aditya', 'ritu', 'ashutosh', 'priya', 'neha', 'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'advait', 'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 'soham', 'rupali'];
    if (sarvamModel === 'bulbul:v3' && !V3_SPEAKERS.includes(speaker.toLowerCase())) {
      const isMale = isSarvamMaleSpeaker(speaker);
      speaker = isMale ? 'shubh' : 'shreya';
    }

    const formattedSpeaker = speaker.toLowerCase();

    const requestBody = {
      text: speechText,
      model: sarvamModel,
      speaker: formattedSpeaker,
      target_language_code: targetLangCode,
      speech_sample_rate: sampleRate,
      output_audio_codec: outputCodec,
      pace: 0.98,
    };

    let response = null;
    try {
      response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'api-subscription-key': sarvamKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchErr) {
      log.warn('sarvam_tts_fetch_network_error', { error: fetchErr.message });
    }

    const isMaleSpeaker = isSarvamMaleSpeaker(speaker);
    let errTxt = null;

    if (!response || !response.ok) {
      errTxt = response ? await response.text().catch(() => 'Unreadable body') : 'Network/API error';
      log.warn('sarvam_tts_first_attempt_failed', { speaker: formattedSpeaker, model: sarvamModel, error: errTxt });

      const fallbackSpeaker = isMaleSpeaker ? 'shubh' : 'shreya';
      if (speaker.toLowerCase() !== fallbackSpeaker.toLowerCase()) {
        log.info('sarvam_tts_retrying_with_fallback_speaker', { fallbackSpeaker });
        requestBody.speaker = fallbackSpeaker;

        try {
          response = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
              'api-subscription-key': sarvamKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          errTxt = null;
        } catch (retryErr) {
          log.warn('sarvam_tts_retry_fetch_failed', { error: retryErr.message });
          response = null;
          errTxt = retryErr.message;
        }
      }
    }

    if (!response || !response.ok) {
      if (!errTxt && response) {
        errTxt = await response.text().catch(() => 'Unreadable body');
      }
      if (errTxt && (errTxt.includes('quota') || errTxt.includes('credits') || errTxt.includes('401') || errTxt.includes('403'))) {
        sarvamQuotaExhausted = true;
      }
      log.warn('sarvam_tts_fully_failed_falling_back_to_deepgram', { error: errTxt || 'Network/API error' });
      const fallbackVoice = isMaleSpeaker ? 'aura-orion-en' : (fmt.encoding === 'mulaw' ? 'aura-stella-en' : 'aura-asteria-en');
      return synthesizeSpeechDirectDeepgram(text, fmt, fallbackVoice);
    }

    let json = null;
    try {
      json = await response.json();
    } catch (jsonErr) {
      log.warn('sarvam_tts_json_parse_failed_falling_back_to_deepgram', { error: jsonErr.message });
      const fallbackVoice = isMaleSpeaker ? 'aura-orion-en' : (fmt.encoding === 'mulaw' ? 'aura-stella-en' : 'aura-asteria-en');
      return synthesizeSpeechDirectDeepgram(text, fmt, fallbackVoice);
    }

    const base64Audio = json?.audios?.[0];
    if (!base64Audio) {
      log.warn('sarvam_tts_empty_audio_list_falling_back_to_deepgram');
      const fallbackVoice = isMaleSpeaker ? 'aura-orion-en' : (fmt.encoding === 'mulaw' ? 'aura-stella-en' : 'aura-asteria-en');
      return synthesizeSpeechDirectDeepgram(text, fmt, fallbackVoice);
    }

    if (fmt.encoding !== 'mulaw') {
      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = addWavHeader(pcmBuffer, 16000, 1, 16);
      return wavBuffer.toString('base64');
    }

    return base64Audio;
  }

  throw new Error(`Unsupported voice provider: ${provider}`);
}
