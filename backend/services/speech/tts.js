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

export async function synthesizeSpeech(text, telephonyOrFormat = true, language = 'en', voiceId = null) {
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
    } else {
      provider = 'elevenlabs';
    }
  } else {
    const detectedLang = detectLanguageOfText(speechText, language);
    const best = getBestMultilingualProvider(detectedLang, 'female');
    provider = best.provider;
    voiceModelOrId = best.voiceModelOrId;
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
      const outputFormat = fmt.encoding === 'mulaw' ? 'ulaw_8000' : 'mp3_44100_128';
      const acceptHeader = fmt.encoding === 'mulaw' ? 'audio/wav' : 'audio/mpeg';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceModelOrId}?output_format=${outputFormat}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsKey,
          'Content-Type': 'application/json',
          'Accept': acceptHeader,
        },
        body: JSON.stringify({
          text: speechText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.50,
            similarity_boost: 0.85,
            style: 0.25,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        const errTxt = await response.text();
        throw new Error(`ElevenLabs TTS failed (${response.status}): ${errTxt}`);
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (elevenErr) {
      log.warn('tts_elevenlabs_failed_fallback_deepgram', { error: elevenErr.message });
      const fallbackVoice = (voiceModelOrId && voiceModelOrId.includes('male')) ? 'aura-orion-en' : 'aura-asteria-en';
      return synthesizeSpeechDirectDeepgram(speechText, fmt, fallbackVoice);
    }
  }

  if (provider === 'sarvam') {
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey || sarvamKey.startsWith('your-')) {
      throw new Error('SARVAM_API_KEY is not set');
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
