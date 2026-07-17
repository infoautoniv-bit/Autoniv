import express from 'express';
import Chatbot from '../db/models/Chatbot.js';
import ChatbotConversation from '../db/models/ChatbotConversation.js';
import { authenticate } from '../middleware/auth.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';

const router = express.Router();

// List user's chatbots
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [chatbots, total] = await Promise.all([
      Chatbot.find({ userId: req.user.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Chatbot.countDocuments({ userId: req.user.userId }),
    ]);

    return res.json({ chatbots, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    log.error('chatbot_list_error', { error: err.message, userId: req.user?.userId });
    return res.status(500).json({ message: 'Failed to fetch chatbots' });
  }
});

// Get single chatbot
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });
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

    // Check plan limits
    const chatbotCount = await Chatbot.countDocuments({ userId: req.user.userId });
    const user = req.user;
    const chatLimit = user?.chatPlan ? getChatbotLimit(user.chatPlan) : 1;
    if (chatLimit !== -1 && chatbotCount >= chatLimit) {
      return res.status(403).json({ message: `Chatbot limit reached (${chatLimit}). Upgrade your plan.` });
    }

    const chatbot = await Chatbot.create({
      userId: req.user.userId,
      name: name.trim(),
      description: description?.trim() || '',
      systemPrompt: systemPrompt.trim(),
      welcomeMessage: welcomeMessage?.trim() || 'Hi! How can I help you today?',
      brandColor: brandColor || '#0077ff',
      channels: {
        whatsapp: { enabled: channels?.whatsapp?.enabled || false, phoneNumberId: channels?.whatsapp?.phoneNumberId || null },
        widget: { enabled: channels?.widget?.enabled !== false },
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
    }
    if (channels?.widget) {
      chatbot.channels.widget.enabled = channels.widget.enabled ?? chatbot.channels.widget.enabled;
    }

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
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId });
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
    const chatbot = await Chatbot.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!chatbot) return res.status(404).json({ message: 'Chatbot not found' });

    const totalConversations = await ChatbotConversation.countDocuments({ chatbotId: chatbot._id });
    const whatsappConversations = await ChatbotConversation.countDocuments({ chatbotId: chatbot._id, channel: 'whatsapp' });
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
      widgetConversations,
      todayConversations,
      totalMessages: totalMessages[0]?.total || 0,
    });
  } catch (err) {
    log.error('chatbot_analytics_error', { error: err.message });
    return res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

function getChatbotLimit(chatPlan) {
  const limits = {
    chat_free: 1, chat_starter: 3, chat_growth: 10, chat_enterprise: -1,
    both_free: 1, both_starter: 1, both_growth: 10, both_enterprise: -1,
    free: 1, starter: 1, growth: 10, enterprise: -1,
  };
  return limits[chatPlan] ?? 1;
}

export default router;
