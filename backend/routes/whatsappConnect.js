import express from 'express';
import Chatbot from '../db/models/Chatbot.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { encrypt } from '../services/encryption.js';
import {
  exchangeCodeForToken,
  getWabaPhoneNumbers,
  subscribeWabaToApp,
  registerPhoneNumber,
  isMetaConfigured,
} from '../services/metaWhatsApp.js';
import { log } from '../services/logger.js';

const router = express.Router();
router.use(authenticate);

// Strip sensitive fields before returning a chatbot to the client.
function sanitizeChatbot(chatbot) {
  const obj = chatbot.toObject ? chatbot.toObject() : { ...chatbot };
  if (obj.channels?.whatsapp) {
    delete obj.channels.whatsapp.accessToken;
  }
  return obj;
}

// ─── Connect a chatbot to WhatsApp via Meta Embedded Signup ───────────────────
// The frontend completes the Facebook JS SDK flow and posts the returned
// authorization `code` plus the `wabaId` (and optional `phoneNumberId`).
router.post('/connect', authLimiter, async (req, res) => {
  try {
    if (!isMetaConfigured()) {
      return res.status(503).json({ message: 'WhatsApp connect is not configured on the server.' });
    }

    const { chatbotId, code, wabaId, phoneNumberId: phoneNumberIdHint } = req.body || {};
    if (!chatbotId || !code || !wabaId) {
      return res.status(400).json({ message: 'chatbotId, code and wabaId are required' });
    }

    // Ownership check — same scoping as the rest of chatbots.js.
    const chatbot = await Chatbot.findOne({ _id: chatbotId, userId: req.user.userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    // 1. Exchange the short-lived code for a business access token.
    const { accessToken } = await exchangeCodeForToken(code);

    // 2. Resolve the phone number tied to this WABA.
    const phones = await getWabaPhoneNumbers(wabaId, accessToken);
    const phone = phoneNumberIdHint
      ? phones.find(p => p.id === phoneNumberIdHint) || phones[0]
      : phones[0];

    if (!phone) {
      return res.status(422).json({ message: 'No phone number found for this WhatsApp Business Account.' });
    }

    // 3. Subscribe our app to the WABA so the webhook receives its messages.
    await subscribeWabaToApp(wabaId, accessToken);

    // 4. Best-effort register the number on the Cloud API (non-fatal).
    await registerPhoneNumber(phone.id, accessToken);

    // 5. Persist — token encrypted at rest (Twilio-creds pattern).
    chatbot.channels.whatsapp.enabled = true;
    chatbot.channels.whatsapp.phoneNumberId = phone.id;
    chatbot.channels.whatsapp.wabaId = wabaId;
    chatbot.channels.whatsapp.accessToken = encrypt(accessToken);
    chatbot.channels.whatsapp.displayPhoneNumber = phone.display_phone_number || null;
    chatbot.channels.whatsapp.verifiedName = phone.verified_name || null;
    chatbot.channels.whatsapp.connectedAt = new Date();
    await chatbot.save();

    log.info('whatsapp_connected', {
      chatbotId: String(chatbot._id),
      userId: req.user.userId,
      phoneNumberId: phone.id,
      wabaId,
    });

    return res.json({ chatbot: sanitizeChatbot(chatbot) });
  } catch (err) {
    log.error('whatsapp_connect_error', {
      error: err.message,
      graph: err.graph,
      userId: req.user?.userId,
    });
    return res.status(err.status && err.status < 500 ? 400 : 500).json({
      message: err.message || 'Failed to connect WhatsApp',
    });
  }
});

// ─── Disconnect WhatsApp from a chatbot ───────────────────────────────────────
router.post('/disconnect', async (req, res) => {
  try {
    const { chatbotId } = req.body || {};
    if (!chatbotId) return res.status(400).json({ message: 'chatbotId is required' });

    const chatbot = await Chatbot.findOne({ _id: chatbotId, userId: req.user.userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    chatbot.channels.whatsapp.enabled = false;
    chatbot.channels.whatsapp.phoneNumberId = null;
    chatbot.channels.whatsapp.wabaId = null;
    chatbot.channels.whatsapp.businessId = null;
    chatbot.channels.whatsapp.accessToken = null;
    chatbot.channels.whatsapp.displayPhoneNumber = null;
    chatbot.channels.whatsapp.verifiedName = null;
    chatbot.channels.whatsapp.connectedAt = null;
    await chatbot.save();

    log.info('whatsapp_disconnected', { chatbotId: String(chatbot._id), userId: req.user.userId });
    return res.json({ chatbot: sanitizeChatbot(chatbot) });
  } catch (err) {
    log.error('whatsapp_disconnect_error', { error: err.message, userId: req.user?.userId });
    return res.status(500).json({ message: 'Failed to disconnect WhatsApp' });
  }
});

export default router;
