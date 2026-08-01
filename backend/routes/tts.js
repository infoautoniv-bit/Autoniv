import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { synthesizeSpeech } from '../services/tts.js';

const router = express.Router();

const DEFAULT_PREVIEW_TEXTS = {
  en: 'Hello, this is a preview of the selected voice.',
  hi: 'नमस्ते, मैं आपका AI वॉइस असिस्टेंट हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
  ta: 'வணக்கம், நான் உங்கள் AI குரல் உதவியாளர். இன்று உங்களுக்கு எவ்வாறு உதவ முடியும்?',
  te: 'நமஸ்காரம், நேனு மீ AI வாய்స్ அசிஸ்டெண்ட். நேடு மீகு ஏవిధంగా సహాయపడగలను?',
  mr: 'नमस्कार, मी तुमचा AI व्हॉइस असिस्टंट आहे. आज मी तुम्हाला कशी मदत करू शकतो?',
  bn: 'নমস্কার, আমি আপনার AI ভয়েস সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  gu: 'નમસ્તે, હું તમારો AI વોઇસ આસિસ્ટન્ટ છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?',
  kn: 'ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ AI ಧ್ವನಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
  ml: 'നമസ്കാരം, ഞാൻ നിങ്ങളുടെ AI വോയ്സ് അസിസ്റ്റന്റാണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?',
  pa: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ, ਮੈਂ ਤੁਹਾਡਾ AI ਵੌਇਸ ਸਹਾਇਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
  or: 'ନମସ୍କାର, ମୁଁ ଆପଣଙ୍କର AI ଭଏସ୍ ସହାୟକ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
  es: 'Hola, soy tu asistente de voz con inteligencia artificial. ¿Cómo puedo ayudarte hoy?',
  fr: "Bonjour, je suis votre assistant vocal IA. Comment puis-je vous aider aujourd'hui ?",
  de: 'Hallo, ich bin Ihr KI-Sprachassistent. Wie kann ich Ihnen heute helfen?',
  it: 'Ciao, sono il tuo assistente vocale AI. Come posso aiutarti oggi?',
  pt: 'Olá, sou seu assistente de voz IA. Como posso ajudá-lo hoje?',
  pl: 'Cześć, jestem twoim asystentem głosowym AI. Jak mogę ci dzisiaj pomóc?',
  ar: 'مرحبًا، أنا مساعد الصوت الذكي الخاص بك. كيف يمكنني مساعدتك اليوم؟',
  ja: 'こんにちは、私はあなたのAI音声アシスタントです。今日はどのようにお手伝いできますか？',
  ko: '안녕하세요, 저는 당신의 AI 음성 어시스턴트입니다. 오늘 어떻게 도와드릴까요?',
  zh: '你好，我是你的AI语音助手。今天我能怎么帮助你？',
  nl: 'Hallo, ik ben uw AI-stemassistent. Hoe kan ik u vandaag helpen?',
  ru: 'Здравствуйте, я ваш голосовой помощник на базе ИИ. Чем я могу помочь вам сегодня?',
  tr: 'Merhaba, ben sizin AI ses asistanınız. Bugün size nasıl yardımcı olabilirim?',
};

router.post('/preview', authenticate, async (req, res) => {
  try {
    const { voiceId, language, text } = req.body;
    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }

    const langKey = (language || 'en').toLowerCase();
    const sampleText = text || DEFAULT_PREVIEW_TEXTS[langKey] || DEFAULT_PREVIEW_TEXTS.en;
    // isTwilio = false so it generates high quality 24kHz audio
    const base64Audio = await synthesizeSpeech(sampleText, false, langKey, voiceId);
    
    const buffer = Buffer.from(base64Audio, 'base64');
    res.set('Content-Type', 'audio/wav');
    return res.send(buffer);
  } catch (err) {
    console.error('[TTS Preview Route Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

import mongoose from 'mongoose';
import Agent from '../db/models/Agent.js';

// GET /api/tts/speak — public audio streaming endpoint for Twilio/Exotel TwiML <Play>
router.get('/speak', async (req, res) => {
  try {
    const { text, agentId, voiceId, language } = req.query;
    if (!text) return res.status(400).send('Text is required');

    let effectiveVoiceId = voiceId;
    let effectiveLang = language || 'en';

    if (agentId && mongoose.Types.ObjectId.isValid(agentId)) {
      const agent = await Agent.findById(agentId).lean();
      if (agent) {
        effectiveVoiceId = agent.voiceId || effectiveVoiceId;
        effectiveLang = agent.language || effectiveLang;
      }
    }

    const base64Audio = await synthesizeSpeech(text, true, effectiveLang, effectiveVoiceId);
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    res.set('Content-Type', 'audio/wav');
    res.set('Content-Length', audioBuffer.length);
    return res.send(audioBuffer);
  } catch (err) {
    console.error('[TTS Speak Route Error]', err.message);
    res.status(500).send('TTS synthesis error');
  }
});

export default router;
