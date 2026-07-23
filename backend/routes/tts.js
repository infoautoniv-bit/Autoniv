import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { synthesizeSpeech } from '../services/tts.js';

const router = express.Router();

router.post('/preview', authenticate, async (req, res) => {
  try {
    const { voiceId, language, text } = req.body;
    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }

    const sampleText = text || 'Hello, this is a preview of the selected voice.';
    // isTwilio = false so it generates high quality 24kHz audio
    const base64Audio = await synthesizeSpeech(sampleText, false, language || 'en', voiceId);
    
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
