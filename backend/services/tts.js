// Active pinggy webhook config reload
import WebSocket from 'ws';
import { log } from './logger.js';

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

async function synthesizeSpeechDirectDeepgram(text, isTwilio, modelName) {
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramKey || deepgramKey.startsWith('your-')) {
    throw new Error('DEEPGRAM_API_KEY is not set or is a placeholder');
  }
  const format = isTwilio ? 'encoding=mulaw&sample_rate=8000' : 'encoding=linear16&sample_rate=24000';
  const container = isTwilio ? 'container=none' : 'container=wav';
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

// Gender of every Sarvam Bulbul speaker (mirrors the labels in
// Client/src/config/voices.ts). Used so that when a Sarvam voice fails and we
// fall back — or swap the speaker — a male voice stays male and a female voice
// stays female, instead of defaulting to the wrong gender. Any name not listed
// here is treated as female.
const SARVAM_MALE_SPEAKERS = new Set([
  // Bulbul v3
  'shubh', 'aditya', 'rahul', 'rohan', 'amit', 'dev', 'ratan', 'varun', 'manan',
  'sumit', 'kabir', 'aayan', 'ashutosh', 'advait', 'anand', 'tarun', 'sunny',
  'mani', 'gokul', 'vijay', 'mohit', 'rehan', 'soham',
  // Bulbul v2
  'abhilash', 'karun', 'hitesh',
]);

function isSarvamMaleSpeaker(speaker) {
  return SARVAM_MALE_SPEAKERS.has(String(speaker || '').toLowerCase());
}

export function detectLanguageOfText(text, agentLanguage = 'en') {
  if (!text) return agentLanguage;

  // 1. Script checks (Unicode ranges)
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

  // 2. Character & word checks for common European languages.
  const lowerText = text.toLowerCase();

  // Diacritic checks are strong signals (these characters almost never appear in
  // English), so a single occurrence is enough. Word checks are NOT reliable on
  // their own: common English words ("is", "come", "si", "de", "en"...) also occur
  // in these stopword lists, so a lone match misclassifies English text and hijacks
  // the caller's chosen voice/provider. Require >=2 distinct stopword matches instead.
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
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const sarvamKey = process.env.SARVAM_API_KEY;

  if (detectedLang === 'en' && deepgramKey && !deepgramKey.startsWith('your-')) {
    const voiceId = gender === 'male' ? 'aura-orion-en' : 'aura-asteria-en';
    return { provider: 'deepgram', voiceModelOrId: voiceId };
  }

  if (elevenlabsKey && !elevenlabsKey.startsWith('your-') && !elevenlabsKey.includes('placeholder')) {
    const voiceId = gender === 'male' ? 'cjVigY5qzO86Huf0OWal' : 'hpp4J3VqNfWAUOO0d1Us';
    return { provider: 'elevenlabs', voiceModelOrId: voiceId };
  }

  const sarvamSupported = ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'];
  if (sarvamKey && !sarvamKey.startsWith('your-') && sarvamSupported.includes(detectedLang)) {
    const voiceId = gender === 'male' ? 'shubh' : 'shreya';
    return { provider: 'sarvam', voiceModelOrId: voiceId };
  }

  // Default to Deepgram Aura
  const voiceId = gender === 'male' ? 'aura-orion-en' : 'aura-asteria-en';
  return { provider: 'deepgram', voiceModelOrId: voiceId };
}

export async function synthesizeSpeech(text, isTwilio = true, language = 'en', voiceId = null) {
  let provider = (language === 'en' || !language) ? 'deepgram' : 'elevenlabs';
  let voiceModelOrId = voiceId;

  if (voiceId && voiceId.includes(':')) {
    const parts = voiceId.split(':');
    provider = parts[0];
    voiceModelOrId = parts.slice(1).join(':');
  }

  const detectedLang = detectLanguageOfText(text, language);

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
  const openaiKey = process.env.OPENAI_API_KEY;
  const deepgramKey = process.env.DEEPGRAM_API_KEY;

  const isElevenLabsMissing = provider === 'elevenlabs' && (!elevenlabsKey || elevenlabsKey.startsWith('your-') || elevenlabsKey.includes('placeholder'));
  const isOpenAIMissing = provider === 'openai' && (!openaiKey || openaiKey.startsWith('your-'));
  const isDeepgramMissing = !deepgramKey || deepgramKey.startsWith('your-');

  if (provider === 'deepgram' && !isDeepgramMissing) {
    const fallbackVoice = (voiceModelOrId && voiceModelOrId.includes('male')) ? 'aura-orion-en' : 'aura-asteria-en';
    return synthesizeSpeechDirectDeepgram(text, isTwilio, fallbackVoice);
  }

  if (provider === 'elevenlabs' && !isElevenLabsMissing) {
    try {
      const outputFormat = isTwilio ? 'ulaw_8000' : 'mp3_44100_128';
      const acceptHeader = isTwilio ? 'audio/wav' : 'audio/mpeg';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceModelOrId}?output_format=${outputFormat}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenlabsKey,
          'Content-Type': 'application/json',
          'Accept': acceptHeader,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
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
      console.warn('[TTS] ElevenLabs TTS failed, falling back to Deepgram Aura:', elevenErr.message);
      const fallbackVoice = (voiceModelOrId && voiceModelOrId.includes('male')) ? 'aura-orion-en' : 'aura-asteria-en';
      return synthesizeSpeechDirectDeepgram(text, isTwilio, fallbackVoice);
    }
  }

  if (provider === 'sarvam') {
    const sarvamKey = process.env.SARVAM_API_KEY;
    if (!sarvamKey || sarvamKey.startsWith('your-')) {
      throw new Error('SARVAM_API_KEY is not set');
    }

    const languageCodes = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      or: 'or-IN',
    };

    if (!languageCodes[language]) {
      console.warn(`[TTS] Sarvam does not support language: ${language}. Falling back to Deepgram Aura.`);
      const fallbackVoice = (voiceModelOrId && voiceModelOrId.includes('male')) ? 'aura-orion-en' : 'aura-asteria-en';
      return synthesizeSpeechDirectDeepgram(text, isTwilio, fallbackVoice);
    }

    const targetLangCode = languageCodes[language];
    const sampleRate = isTwilio ? 8000 : 24000;
    const outputCodec = isTwilio ? 'mulaw' : 'linear16';

    let sarvamModel = 'bulbul:v3';
    let speaker = 'shreya';

    if (voiceModelOrId) {
      if (voiceModelOrId.includes(':')) {
        const subparts = voiceModelOrId.split(':');
        if (subparts.length >= 3) {
          sarvamModel = `${subparts[0]}:${subparts[1]}`;
          speaker = subparts[2];
        } else if (subparts.length === 2) {
          sarvamModel = `${subparts[0]}:${subparts[1]}`;
          speaker = 'shreya';
        }
      } else if (voiceModelOrId === 'bulbul') {
        sarvamModel = 'bulbul:v3';
        speaker = 'shreya';
      } else {
        sarvamModel = 'bulbul:v3';
        speaker = voiceModelOrId;
      }
    }

    // Automatically upgrade V2 to V3 model if language is not Hindi, since V2 is Hindi-only
    if (sarvamModel === 'bulbul:v2' && language !== 'hi') {
      sarvamModel = 'bulbul:v3';
      const isMale = isSarvamMaleSpeaker(speaker);
      speaker = isMale ? 'shubh' : 'shreya';
    }

    // Safeguard: Ensure speaker matches V3 model compatibility constraints
    const V3_SPEAKERS = ['aditya', 'ritu', 'ashutosh', 'priya', 'neha', 'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'advait', 'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 'soham', 'rupali'];
    if (sarvamModel === 'bulbul:v3' && !V3_SPEAKERS.includes(speaker.toLowerCase())) {
      const isMale = isSarvamMaleSpeaker(speaker);
      speaker = isMale ? 'shubh' : 'shreya';
    }

    const formattedSpeaker = speaker.toLowerCase();

    const requestBody = {
      text,
      model: sarvamModel,
      speaker: formattedSpeaker,
      target_language_code: targetLangCode,
      speech_sample_rate: sampleRate,
      output_audio_codec: outputCodec,
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

      // Fallback: Retry with gender-matched fallback speaker
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
          errTxt = null; // Reset error for retried response
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
      // Final fallback to Deepgram with correct gender
      const fallbackVoice = isMaleSpeaker ? 'aura-orion-en' : (isTwilio ? 'aura-stella-en' : 'aura-asteria-en');
      return synthesizeSpeechDirectDeepgram(text, isTwilio, fallbackVoice);
    }

    let json = null;
    try {
      json = await response.json();
    } catch (jsonErr) {
      log.warn('sarvam_tts_json_parse_failed_falling_back_to_deepgram', { error: jsonErr.message });
      const fallbackVoice = isMaleSpeaker ? 'aura-orion-en' : (isTwilio ? 'aura-stella-en' : 'aura-asteria-en');
      return synthesizeSpeechDirectDeepgram(text, isTwilio, fallbackVoice);
    }

    const base64Audio = json?.audios?.[0];
    if (!base64Audio) {
      log.warn('sarvam_tts_empty_audio_list_falling_back_to_deepgram');
      const fallbackVoice = isMaleSpeaker ? 'aura-orion-en' : (isTwilio ? 'aura-stella-en' : 'aura-asteria-en');
      return synthesizeSpeechDirectDeepgram(text, isTwilio, fallbackVoice);
    }

    if (!isTwilio) {
      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);
      return wavBuffer.toString('base64');
    }

    return base64Audio;
  }

  throw new Error(`Unsupported voice provider: ${provider}`);
}
