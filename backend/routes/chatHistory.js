import express from 'express';
import mongoose from 'mongoose';
import ChatSession from '../db/models/ChatSession.js';
import Chatbot from '../db/models/Chatbot.js';
import ChatbotConversation from '../db/models/ChatbotConversation.js';
import User from '../db/models/User.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { log } from '../services/logger.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('chat'));

// GET /api/chat-history — list all sessions for current user (playground + channel chatbots)
router.get('/', async (req, res) => {
  try {
    const oid = new mongoose.Types.ObjectId(req.user.userId);
    const userChatbots = await Chatbot.find({ userId: oid }).select('_id name').lean();
    const chatbotMap = new Map(userChatbots.map(c => [c._id.toString(), c.name]));
    const chatbotIds = userChatbots.map(c => c._id);

    const [sessions, chatbotConvs, user] = await Promise.all([
      ChatSession.find({ userId: oid }).select('title createdAt updatedAt messages').sort({ updatedAt: -1 }).lean(),
      ChatbotConversation.find({ chatbotId: { $in: chatbotIds } }).sort({ updatedAt: -1 }).limit(100).lean(),
      User.findById(oid).select('chatUsed chatLimit').lean()
    ]);

    const sessionSummary = sessions.map(s => ({
      id: s._id.toString(),
      title: s.title,
      channel: 'playground',
      messageCount: s.messages ? s.messages.length : 0,
      lastMessage: s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1].text.slice(0, 80) : '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    const chatbotSummary = chatbotConvs.map(c => {
      const botName = chatbotMap.get(c.chatbotId.toString()) || 'AI Chatbot';
      const channelLabel = c.channel ? (c.channel.charAt(0).toUpperCase() + c.channel.slice(1)) : 'Channel';
      const title = `${botName} [${channelLabel}: ${c.customerIdentifier.replace(/^tg_/, '')}]`;
      return {
        id: c._id.toString(),
        title,
        channel: c.channel || 'chatbot',
        isExternal: true,
        messageCount: c.messages ? c.messages.length : 0,
        lastMessage: c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].text.slice(0, 80) : '',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt || c.lastActive,
      };
    });

    const combined = [...sessionSummary, ...chatbotSummary].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    // Sync user.chatUsed with the actual total number of unique conversation sessions across channels & playground
    const totalCount = combined.length;
    const updatedUser = await User.findByIdAndUpdate(
      oid,
      { $set: { chatUsed: totalCount } },
      { new: true }
    ).select('chatUsed chatLimit').lean();

    res.json({ sessions: combined, chatUsed: updatedUser?.chatUsed ?? totalCount, chatLimit: updatedUser?.chatLimit || 0 });
  } catch (err) {
    log.error('fetch_chat_sessions_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// GET /api/chat-history/:id — get a single session with all messages
router.get('/:id', async (req, res) => {
  try {
    const oid = new mongoose.Types.ObjectId(req.user.userId);
    let session = await ChatSession.findOne({
      _id: req.params.id,
      userId: oid,
    }).lean();

    if (!session) {
      const userChatbots = await Chatbot.find({ userId: oid }).select('_id name').lean();
      const chatbotMap = new Map(userChatbots.map(c => [c._id.toString(), c.name]));
      const chatbotIds = userChatbots.map(c => c._id);

      const conv = await ChatbotConversation.findOne({
        _id: req.params.id,
        chatbotId: { $in: chatbotIds },
      }).lean();

      if (conv) {
        const botName = chatbotMap.get(conv.chatbotId.toString()) || 'AI Chatbot';
        const channelLabel = conv.channel ? (conv.channel.charAt(0).toUpperCase() + conv.channel.slice(1)) : 'Channel';
        const title = `${botName} [${channelLabel}: ${conv.customerIdentifier.replace(/^tg_/, '')}]`;
        session = {
          _id: conv._id,
          title,
          isExternal: true,
          channel: conv.channel,
          messages: conv.messages || [],
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt || conv.lastActive,
        };
      }
    }

    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({
      id: session._id.toString(),
      title: session.title,
      isExternal: session.isExternal || false,
      channel: session.channel || 'playground',
      messages: session.messages || [],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    log.error('fetch_chat_session_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch session' });
  }
});

// POST /api/chat-history — create a new session
router.post('/', async (req, res) => {
  try {
    const oid = new mongoose.Types.ObjectId(req.user.userId);
    const { title, messages } = req.body;

    const session = await ChatSession.create({
      userId: oid,
      title: title || 'New Chat',
      messages: messages || [],
    });

    const user = await User.findById(oid).select('chatUsed chatLimit').lean();

    res.status(201).json({
      id: session._id.toString(),
      title: session.title,
      messages: session.messages,
      createdAt: session.createdAt,
      chatUsed: user?.chatUsed || 0,
    });
  } catch (err) {
    log.error('create_chat_session_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create session' });
  }
});

// PUT /api/chat-history/:id — update session (add messages, rename)
router.put('/:id', async (req, res) => {
  try {
    const oid = new mongoose.Types.ObjectId(req.user.userId);
    const { title, messages } = req.body;

    const update = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (messages !== undefined) update.messages = messages;

    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, userId: oid },
      { $set: update },
      { new: true },
    ).lean();

    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({
      id: session._id.toString(),
      title: session.title,
      messages: session.messages,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    log.error('update_chat_session_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to update session' });
  }
});

// DELETE /api/chat-history/:id — delete a session
router.delete('/:id', async (req, res) => {
  try {
    const oid = new mongoose.Types.ObjectId(req.user.userId);
    let result = await ChatSession.deleteOne({ _id: req.params.id, userId: oid });
    if (result.deletedCount === 0) {
      const userChatbots = await Chatbot.find({ userId: oid }).select('_id').lean();
      const chatbotIds = userChatbots.map(c => c._id);
      result = await ChatbotConversation.deleteOne({ _id: req.params.id, chatbotId: { $in: chatbotIds } });
    }
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Session not found' });

    const user = await User.findById(oid).select('chatUsed chatLimit').lean();

    res.json({ message: 'Deleted', chatUsed: user?.chatUsed || 0 });
  } catch (err) {
    log.error('delete_chat_session_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

export default router;
