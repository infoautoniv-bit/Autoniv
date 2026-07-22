import express from 'express';
import Chatbot from '../db/models/Chatbot.js';
import { handleChatbotMessage } from '../services/whatsappChatbot.js';
import { log } from '../services/logger.js';

const router = express.Router();
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'autoniv_chatbot_verify';

// Meta webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'] || req.query['hub_mode'];
  const token = req.query['hub.verify_token'] || req.query['hub_verify_token'];
  const challenge = req.query['hub.challenge'] || req.query['hub_challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    log.info('facebook_webhook_verified');
    return res.status(200).send(challenge);
  }

  log.warn('facebook_webhook_verification_failed', { mode, token });
  return res.sendStatus(403);
});

// Incoming messages
router.post('/', async (req, res) => {
  try {
    res.sendStatus(200); // Acknowledge immediately to prevent retries

    const { object, entry } = req.body;
    if (object !== 'page' && object !== 'instagram') {
      return;
    }

    for (const ent of (entry || [])) {
      const pageId = ent.id; // pageId or instagram account id
      const messagingList = ent.messaging || [];

      for (const msg of messagingList) {
        if (!msg.message || !msg.message.text || msg.message.is_echo) {
          continue; // skip echoes and non-text messages
        }

        const senderId = msg.sender.id;
        const text = msg.message.text.trim();

        // Find the chatbot connected to this Page ID or Instagram Account ID
        const chatbot = await Chatbot.findOne({
          $or: [
            { 'channels.facebook.pageId': pageId },
            { 'channels.facebook.instagramAccountId': pageId }
          ]
        });

        if (!chatbot || !chatbot.isActive || !chatbot.channels?.facebook?.enabled || !chatbot.channels?.facebook?.pageAccessToken) {
          log.debug('facebook_webhook_chatbot_not_active_or_unconfigured', { pageId });
          continue;
        }

        // Run chatbot AI engine
        const reply = await handleChatbotMessage({
          chatbotId: chatbot._id,
          channel: object, // 'page' (Messenger) or 'instagram'
          customerIdentifier: `${object}_${senderId}`,
          message: text,
        });

        // Send reply back via Meta Graph API
        const token = chatbot.channels.facebook.pageAccessToken;
        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: senderId },
            message: { text: reply }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          log.error('facebook_webhook_send_failed', { chatbotId: chatbot._id, status: response.status, error: errorText });
        }
      }
    }
  } catch (err) {
    log.error('facebook_webhook_error', { error: err.message });
  }
});

export default router;
