import express from 'express';
import Chatbot from '../db/models/Chatbot.js';
import ChatbotConversation from '../db/models/ChatbotConversation.js';
import User from '../db/models/User.js';
import { authenticate } from '../middleware/auth.js';
import { resolvePlans, PLAN_CONFIG } from '../services/planResolver.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import { encrypt, decrypt } from '../services/encryption.js';

const router = express.Router();

// Resolve how many chatbots a user's plan allows (-1 = unlimited).
// Admins bypass the limit entirely.
async function resolveChatbotLimit(userId, role) {
  if (role === 'admin') return -1;
  const user = await User.findById(userId).lean();
  if (!user) return 1;
  const { chatPlan } = resolvePlans(user);
  const cfg = PLAN_CONFIG[chatPlan];
  // A user with no chat plan gets no chatbots.
  if (!cfg || chatPlan === 'none') return 0;
  return cfg.limits.chatbots ?? 1;
}

// List user's chatbots
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [chatbots, total, chatLimit] = await Promise.all([
      Chatbot.find({ userId: req.user.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Chatbot.countDocuments({ userId: req.user.userId }),
      resolveChatbotLimit(req.user.userId, req.user.role),
    ]);

    const sanitized = chatbots.map(c => {
      if (c.channels?.whatsapp) delete c.channels.whatsapp.accessToken;
      if (c.channels?.telegram?.token) {
        c.channels.telegram.token = '••••••••••••••••';
      }
      return c;
    });

    return res.json({ chatbots: sanitized, total, page, pages: Math.ceil(total / limit), limit: chatLimit });
  } catch (err) {
    log.error('chatbot_list_error', { error: err.message, userId: req.user?.userId });
    return res.status(500).json({ message: 'Failed to fetch chatbots' });
  }
});

// Get single chatbot
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId }).lean();
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });
    
    if (chatbot.channels?.whatsapp) {
      delete chatbot.channels.whatsapp.accessToken;
    }
    if (chatbot.channels?.telegram?.token) {
      chatbot.channels.telegram.token = '••••••••••••••••';
    }
    
    return res.json({ chatbot });
  } catch (err) {
    log.error('chatbot_get_error', { error: err.message });
    return res.status(500).json({ message: 'Failed to fetch chatbot' });
  }
});

// Create chatbot
router.post('/', authenticate, contentFilter('name', 'systemPrompt'), async (req, res) => {
  try {
    const { name, description, systemPrompt, welcomeMessage, brandColor, channels } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!systemPrompt?.trim()) return res.status(400).json({ message: 'System prompt is required' });

    // Enforce plan-based chatbot limit (resolves the user's real chat plan).
    const [chatbotCount, chatLimit] = await Promise.all([
      Chatbot.countDocuments({ userId: req.user.userId }),
      resolveChatbotLimit(req.user.userId, req.user.role),
    ]);
    if (chatLimit === 0) {
      return res.status(403).json({
        message: 'Your current plan does not include chatbots. Please upgrade to a chat plan.',
        code: 'CHATBOT_PLAN_REQUIRED',
      });
    }
    if (chatLimit !== -1 && chatbotCount >= chatLimit) {
      return res.status(403).json({
        message: `Chatbot limit reached (${chatbotCount}/${chatLimit}). Upgrade your plan to add more.`,
        code: 'CHATBOT_LIMIT_EXCEEDED',
        used: chatbotCount,
        limit: chatLimit,
      });
    }

    const chatbot = await Chatbot.create({
      userId: req.user.userId,
      name: name.trim(),
      description: description?.trim() || '',
      systemPrompt: systemPrompt.trim(),
      welcomeMessage: welcomeMessage?.trim() || 'Hi! How can I help you today?',
      brandColor: brandColor || '#0077ff',
      channels: {
        whatsapp: {
          enabled: channels?.whatsapp?.enabled || false,
          phoneNumberId: channels?.whatsapp?.phoneNumberId || null,
          displayPhoneNumber: channels?.whatsapp?.displayPhoneNumber || null,
          accessToken: channels?.whatsapp?.accessToken ? encrypt(channels.whatsapp.accessToken) : null,
          connectedAt: channels?.whatsapp?.accessToken ? new Date() : null,
        },
        widget: { enabled: channels?.widget?.enabled !== false },
        telegram: {
          enabled: channels?.telegram?.enabled || false,
          token: channels?.telegram?.token ? encrypt(channels.telegram.token) : null,
          botUsername: channels?.telegram?.botUsername || null,
        },
      },
    });

    log.info('chatbot_created', { chatbotId: String(chatbot._id), name, userId: req.user.userId });
    return res.status(201).json({ chatbot });
  } catch (err) {
    log.error('chatbot_create_error', { error: err.message, userId: req.user.userId });
    return res.status(500).json({ message: 'Failed to create chatbot' });
  }
});

// Update chatbot
router.put('/:id', authenticate, contentFilter('name', 'systemPrompt'), async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    const { name, description, systemPrompt, welcomeMessage, brandColor, brandLogo, isActive, channels } = req.body;

    if (name !== undefined) chatbot.name = name.trim();
    if (description !== undefined) chatbot.description = description.trim();
    if (systemPrompt !== undefined) chatbot.systemPrompt = systemPrompt.trim();
    if (welcomeMessage !== undefined) chatbot.welcomeMessage = welcomeMessage.trim();
    if (brandColor !== undefined) chatbot.brandColor = brandColor;
    if (brandLogo !== undefined) chatbot.brandLogo = brandLogo;
    if (isActive !== undefined) chatbot.isActive = isActive;
    if (channels?.whatsapp) {
      chatbot.channels.whatsapp.enabled = channels.whatsapp.enabled ?? chatbot.channels.whatsapp.enabled;
      chatbot.channels.whatsapp.phoneNumberId = channels.whatsapp.phoneNumberId ?? chatbot.channels.whatsapp.phoneNumberId;
      chatbot.channels.whatsapp.displayPhoneNumber = channels.whatsapp.displayPhoneNumber ?? chatbot.channels.whatsapp.displayPhoneNumber;
      if (channels.whatsapp.accessToken) {
        chatbot.channels.whatsapp.accessToken = encrypt(channels.whatsapp.accessToken);
        chatbot.channels.whatsapp.connectedAt = new Date();
      } else if (channels.whatsapp.accessToken === null || channels.whatsapp.accessToken === '') {
        chatbot.channels.whatsapp.accessToken = null;
        chatbot.channels.whatsapp.connectedAt = null;
      }
    }
    if (channels?.widget) {
      chatbot.channels.widget.enabled = channels.widget.enabled ?? chatbot.channels.widget.enabled;
    }
    if (channels?.telegram) {
      const oldTokenEncrypted = chatbot.channels?.telegram?.token;
      const oldToken = oldTokenEncrypted ? decrypt(oldTokenEncrypted) : null;
      chatbot.channels.telegram.enabled = channels.telegram.enabled ?? chatbot.channels.telegram.enabled;
      
      if (channels.telegram.token) {
        if (channels.telegram.token === '••••••••••••••••') {
          // Keep old token (no change)
        } else {
          chatbot.channels.telegram.token = encrypt(channels.telegram.token);
        }
      } else if (channels.telegram.token === null || channels.telegram.token === '') {
        chatbot.channels.telegram.token = null;
      }
      
      chatbot.channels.telegram.botUsername = channels.telegram.botUsername ?? chatbot.channels.telegram.botUsername;

      // Automatically register Telegram webhook if token changed and not placeholder
      if (channels.telegram.token && channels.telegram.token !== oldToken && channels.telegram.token !== '••••••••••••••••') {
        const host = req.get('host');
        const protocol = req.protocol === 'http' && host.includes('localhost') ? 'http' : 'https';
        const webhookUrl = `${protocol}://${host}/api/webhooks/telegram/${chatbot._id}`;
        const setWebhookUrl = `https://api.telegram.org/bot${channels.telegram.token}/setWebhook?url=${webhookUrl}`;
        
        try {
          const tgRes = await fetch(setWebhookUrl);
          const tgData = await tgRes.json();
          if (!tgData.ok) {
            log.warn('telegram_set_webhook_failed', { error: tgData.description });
          } else {
            log.info('telegram_set_webhook_success', { chatbotId: chatbot._id });
          }
        } catch (err) {
          log.error('telegram_set_webhook_error', { error: err.message });
        }
      }
    }
    if (channels?.facebook) {
      chatbot.channels.facebook.enabled = channels.facebook.enabled ?? chatbot.channels.facebook.enabled;
      chatbot.channels.facebook.pageId = channels.facebook.pageId ?? chatbot.channels.facebook.pageId;
      chatbot.channels.facebook.pageAccessToken = channels.facebook.pageAccessToken ?? chatbot.channels.facebook.pageAccessToken;
      chatbot.channels.facebook.instagramAccountId = channels.facebook.instagramAccountId ?? chatbot.channels.facebook.instagramAccountId;
    }

    if (req.body.crmIntegrations) {
      chatbot.crmIntegrations = {
        hubspotToken: req.body.crmIntegrations.hubspotToken !== undefined ? req.body.crmIntegrations.hubspotToken : chatbot.crmIntegrations?.hubspotToken,
        webhookUrl: req.body.crmIntegrations.webhookUrl !== undefined ? req.body.crmIntegrations.webhookUrl : chatbot.crmIntegrations?.webhookUrl
      };
    }

    chatbot.markModified('channels');
    chatbot.markModified('crmIntegrations');

    await chatbot.save();
    log.info('chatbot_updated', { chatbotId: String(chatbot._id), userId: req.user.userId });
    return res.json({ chatbot });
  } catch (err) {
    log.error('chatbot_update_error', { error: err.message });
    return res.status(500).json({ message: 'Failed to update chatbot' });
  }
});

// Delete chatbot
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const chatbot = await Chatbot.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    await ChatbotConversation.deleteMany({ chatbotId: chatbot._id });
    log.info('chatbot_deleted', { chatbotId: String(chatbot._id), userId: req.user.userId });
    return res.json({ message: 'Chatbot deleted' });
  } catch (err) {
    log.error('chatbot_delete_error', { error: err.message });
    return res.status(500).json({ message: 'Failed to delete chatbot' });
  }
});

// Get chatbot conversations
router.get('/:id/conversations', authenticate, async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId }).select('_id').lean();
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      ChatbotConversation.find({ chatbotId: chatbot._id })
        .sort({ lastActive: -1 })
        .skip(skip)
        .limit(limit)
        .select('channel customerIdentifier lastActive messages createdAt'),
      ChatbotConversation.countDocuments({ chatbotId: chatbot._id }),
    ]);

    const result = conversations.map(c => ({
      _id: c._id,
      channel: c.channel,
      customerIdentifier: c.customerIdentifier,
      lastActive: c.lastActive,
      messageCount: c.messages.length,
      lastMessage: c.messages.length > 0 ? c.messages[c.messages.length - 1].text : '',
      createdAt: c.createdAt,
    }));

    return res.json({ conversations: result, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    log.error('chatbot_conversations_error', { error: err.message });
    return res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get chatbot analytics
router.get('/:id/analytics', authenticate, async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId }).select('_id').lean();
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    const totalConversations = await ChatbotConversation.countDocuments({ chatbotId: chatbot._id });
    const whatsappConversations = await ChatbotConversation.countDocuments({ chatbotId: chatbot._id, channel: 'whatsapp' });
    const telegramConversations = await ChatbotConversation.countDocuments({ chatbotId: chatbot._id, channel: 'telegram' });
    const widgetConversations = await ChatbotConversation.countDocuments({ chatbotId: chatbot._id, channel: 'widget' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayConversations = await ChatbotConversation.countDocuments({ chatbotId: chatbot._id, createdAt: { $gte: today } });

    const totalMessages = await ChatbotConversation.aggregate([
      { $match: { chatbotId: chatbot._id } },
      { $project: { count: { $size: '$messages' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);

    return res.json({
      totalConversations,
      whatsappConversations,
      telegramConversations,
      widgetConversations,
      todayConversations,
      totalMessages: totalMessages[0]?.total || 0,
    });
  } catch (err) {
    log.error('chatbot_analytics_error', { error: err.message });
    return res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Update chatbot integrations
router.put('/:id/integrations', authenticate, async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    const { telegram, facebook, crm } = req.body;

    if (telegram) {
      const oldTokenEncrypted = chatbot.channels?.telegram?.token;
      const oldToken = oldTokenEncrypted ? decrypt(oldTokenEncrypted) : null;
      chatbot.channels.telegram.enabled = !!telegram.enabled;
      
      if (telegram.token) {
        if (telegram.token === '••••••••••••••••') {
          // Keep old token (no change)
        } else {
          chatbot.channels.telegram.token = encrypt(telegram.token);
        }
      } else if (telegram.token === null || telegram.token === '') {
        chatbot.channels.telegram.token = null;
      }
      
      chatbot.channels.telegram.botUsername = telegram.botUsername || null;

      // Automatically set webhook if token is provided & changed & not placeholder
      if (telegram.token && telegram.token !== oldToken && telegram.token !== '••••••••••••••••') {
        const host = req.get('host');
        const protocol = req.protocol === 'http' && host.includes('localhost') ? 'http' : 'https';
        const webhookUrl = `${protocol}/api/webhooks/telegram/${chatbot._id}`;
        const setWebhookUrl = `https://api.telegram.org/bot${telegram.token}/setWebhook?url=${webhookUrl}`;
        
        try {
          const tgRes = await fetch(setWebhookUrl);
          const tgData = await tgRes.json();
          if (!tgData.ok) {
            log.warn('telegram_set_webhook_failed', { error: tgData.description });
          } else {
            log.info('telegram_set_webhook_success', { chatbotId: chatbot._id });
          }
        } catch (err) {
          log.error('telegram_set_webhook_error', { error: err.message });
        }
      }
    }

    if (facebook) {
      chatbot.channels.facebook.enabled = !!facebook.enabled;
      chatbot.channels.facebook.pageId = facebook.pageId || null;
      chatbot.channels.facebook.pageAccessToken = facebook.pageAccessToken || null;
      chatbot.channels.facebook.instagramAccountId = facebook.instagramAccountId || null;
    }

    if (crm) {
      chatbot.crmIntegrations = {
        hubspotToken: crm.hubspotToken || null,
        webhookUrl: crm.webhookUrl || null
      };
    }

    // Mark changes on nested objects since Mongoose doesn't always detect them
    chatbot.markModified('channels');
    chatbot.markModified('crmIntegrations');

    await chatbot.save();
    return res.json({ message: 'Integrations updated successfully', chatbot });
  } catch (err) {
    log.error('chatbot_update_integrations_error', { error: err.message });
    return res.status(500).json({ message: 'Failed to update integrations' });
  }
});

export default router;
