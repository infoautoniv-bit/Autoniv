import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { synthesizeSpeech } from '../services/tts.js';

const router = express.Router();
router.use(authenticate);

router.post('/preview', async (req, res) => {
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

export default router;
