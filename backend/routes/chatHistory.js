import express from 'express';
import mongoose from 'mongoose';
import ChatSession from '../db/models/ChatSession.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { log } from '../services/logger.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('chat'));

// GET /api/chat-history — list all sessions for current user
router.get('/', async (req, res) => {
  try {
    const oid = new mongoose.Types.ObjectId(req.user.userId);
    const sessions = await ChatSession.find({ userId: oid })
      .select('title createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .lean();

    const summary = sessions.map(s => ({
      id: s._id.toString(),
      title: s.title,
      messageCount: s.messages.length,
      lastMessage: s.messages.length > 0 ? s.messages[s.messages.length - 1].text.slice(0, 80) : '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.json({ sessions: summary });
  } catch (err) {
    log.error('fetch_chat_sessions_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// GET /api/chat-history/:id — get a single session with all messages
router.get('/:id', async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.userId),
    }).lean();

    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json({
      id: session._id.toString(),
      title: session.title,
      messages: session.messages,
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

    res.status(201).json({
      id: session._id.toString(),
      title: session.title,
      messages: session.messages,
      createdAt: session.createdAt,
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
    const result = await ChatSession.deleteOne({ _id: req.params.id, userId: oid });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    log.error('delete_chat_session_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

export default router;
