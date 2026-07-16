import mongoose from 'mongoose';
import express from 'express';
import Agent from '../db/models/Agent.js';
import User from '../db/models/User.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('chat'));

function normalizeChatbot(agent) {
  if (!agent) return null;
  const obj = agent.toObject ? agent.toObject() : { ...agent };
  obj.id = obj._id ? obj._id.toString() : obj.id;
  if (obj.userId) obj.userId = obj.userId.toString();
  return obj;
}

// GET /chatbots/my — fetch user's chatbots
router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);

    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const matchStage = { userId, isChatbot: true };

    const pipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
    ];

    const countPipeline = [{ $match: matchStage }, { $count: 'total' }];

    const [chatbots, countResult] = await Promise.all([
      Agent.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      Agent.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const normalized = (chatbots || []).map(normalizeChatbot);

    res.json(paginatedResponse({ items: normalized, total, page, limit }));
  } catch (err) {
    log.error('get_my_chatbots_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch chatbots' });
  }
});

// POST /chatbots — create a chatbot
router.post('/', contentFilter('name', 'prompt'), async (req, res) => {
  try {
    const { name, type, prompt, language, useCustomEngine, customEngineModel } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: 'name and type are required' });
    }
    const VALID_TYPES = ['receptionist', 'appointment', 'faq'];
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    // Check chatbot limit from plan config
    const PLAN_CONFIG = User.PLAN_CONFIG;
    const planKey = user.plan || user.chatPlan || 'chat_free';
    const planCfg = PLAN_CONFIG[planKey];
    if (planCfg) {
      const maxChatbots = planCfg.limits.chatbots;
      if (maxChatbots !== -1) {
        const count = await Agent.countDocuments({ userId: user._id, isChatbot: true });
        if (count >= maxChatbots) {
          return res.status(403).json({
            message: `Your plan allows a maximum of ${maxChatbots} chatbot${maxChatbots > 1 ? 's' : ''}. Please upgrade to add more.`,
            code: 'CHATBOT_LIMIT_EXCEEDED',
            used: count,
            limit: maxChatbots,
          });
        }
      }
    }

    const agent = await Agent.create({
      userId: user._id,
      name,
      type,
      prompt: prompt || null,
      language: language || 'en',
      isActive: true,
      useCustomEngine: useCustomEngine !== undefined ? !!useCustomEngine : true,
      customEngineModel: customEngineModel || 'groq:llama-3.3-70b',
      isChatbot: true,
    });

    res.status(201).json(normalizeChatbot(agent));
  } catch (err) {
    log.error('create_chatbot_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create chatbot' });
  }
});

// PUT /chatbots/:id — update a chatbot
router.put('/:id', contentFilter('name', 'prompt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, prompt, isActive, language, useCustomEngine, customEngineModel } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid chatbot ID' });
    }

    const agent = await Agent.findOne({ _id: id, userId: req.user.userId, isChatbot: true });
    if (!agent) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    if (name !== undefined) agent.name = name;
    if (type !== undefined) agent.type = type;
    if (prompt !== undefined) agent.prompt = prompt || null;
    if (isActive !== undefined) agent.isActive = !!isActive;
    if (language !== undefined) agent.language = language || null;
    if (useCustomEngine !== undefined) agent.useCustomEngine = !!useCustomEngine;
    if (customEngineModel !== undefined) agent.customEngineModel = customEngineModel || 'groq:llama-3.3-70b';

    await agent.save();
    res.json(normalizeChatbot(agent));
  } catch (err) {
    log.error('update_chatbot_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to update chatbot' });
  }
});

// DELETE /chatbots/:id — delete a chatbot
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid chatbot ID' });
    }

    const agent = await Agent.findOneAndDelete({ _id: id, userId: req.user.userId, isChatbot: true });
    if (!agent) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    res.json({ message: 'Chatbot deleted successfully' });
  } catch (err) {
    log.error('delete_chatbot_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to delete chatbot' });
  }
});

export default router;
