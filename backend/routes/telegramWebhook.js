import express from 'express';
import Chatbot from '../db/models/Chatbot.js';
import { handleChatbotMessage } from '../services/whatsappChatbot.js';
import { log } from '../services/logger.js';
import { decrypt } from '../services/encryption.js';

const router = express.Router();

router.post('/:chatbotId', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { message } = req.body;

    if (!message || !message.text || !message.chat?.id) {
      // Return 200 to acknowledge receipt of other update types
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      log.warn('telegram_webhook_chatbot_not_found', { chatbotId });
      return res.sendStatus(200);
    }

    if (!chatbot.isActive || !chatbot.channels?.telegram?.enabled || !chatbot.channels?.telegram?.token) {
      log.debug('telegram_webhook_chatbot_disabled_or_unconfigured', { chatbotId });
      return res.sendStatus(200);
    }

    const reply = await handleChatbotMessage({
      chatbotId: chatbot._id,
      channel: 'telegram',
      customerIdentifier: `tg_${chatId}`,
      message: text,
    });

    // Send reply back to Telegram
    const encryptedToken = chatbot.channels.telegram.token;
    const token = decrypt(encryptedToken);
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('telegram_webhook_send_failed', { chatbotId, status: response.status, error: errorText });
    }

    return res.sendStatus(200);
  } catch (err) {
    log.error('telegram_webhook_error', { error: err.message });
    return res.sendStatus(200); // Always return 200 so Telegram stops retrying
  }
});

export default router;
