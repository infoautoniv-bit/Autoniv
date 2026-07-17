import express from 'express';
import { handleChatbotMessage, findChatbotByPhoneId } from '../services/whatsappChatbot.js';
import { log } from '../services/logger.js';

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'autoniv_chatbot_verify';

// Meta webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    log.info('whatsapp_webhook_verified');
    return res.status(200).send(challenge);
  }

  log.warn('whatsapp_webhook_verification_failed', { mode, token });
  return res.sendStatus(403);
});

// Incoming messages
router.post('/', async (req, res) => {
  try {
    // Always respond 200 immediately to prevent Meta retries
    res.sendStatus(200);

    const body = req.body;

    if (body.object !== 'whatsapp_business_account') return;

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value || {};
        const messages = value.metadata ? (value.messages || []) : [];
        const phoneNumberId = value.metadata?.phone_number_id;

        for (const msg of messages) {
          if (msg.type !== 'text') continue;

          const customerPhone = msg.from;
          const text = msg.text?.body?.trim();
          if (!text || !customerPhone || !phoneNumberId) continue;

          log.info('whatsapp_incoming_message', { from: customerPhone, phoneNumberId, text: text.slice(0, 50) });

          // Find the chatbot assigned to this phone number
          const chatbot = await findChatbotByPhoneId(phoneNumberId);
          if (!chatbot) {
            log.warn('whatsapp_no_chatbot_for_phone', { phoneNumberId });
            continue;
          }

          // Get AI response
          const reply = await handleChatbotMessage({
            chatbotId: chatbot._id,
            channel: 'whatsapp',
            customerIdentifier: customerPhone,
            message: text,
          });

          // Send reply back via Meta API
          await sendWhatsAppReply(phoneNumberId, customerPhone, reply);
        }
      }
    }
  } catch (err) {
    log.error('whatsapp_webhook_error', { error: err.message });
  }
});

async function sendWhatsAppReply(phoneNumberId, toPhone, text) {
  const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiKey || !phoneNumberId) {
    log.warn('whatsapp_reply_no_config', { phoneNumberId });
    return;
  }

  const url = `${apiUrl.replace(/\/$/, '')}/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      log.error('whatsapp_reply_failed', { status: res.status, body: body.slice(0, 200) });
    }
  } catch (err) {
    log.error('whatsapp_reply_error', { error: err.message });
  }
}

export default router;
