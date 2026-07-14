// routes/leads.js
import express from 'express';
import Lead from '../db/models/Lead.js';
import Agent from '../db/models/Agent.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requireValidObjectId } from '../middleware/validators.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';

const router = express.Router();

// ─── PUBLIC (no auth) ────────────────────────────────────────────────────────
// AI Assistant widget submits here — stored under dummy userId, visible to admin only
router.post('/public', contentFilter('name', 'purpose', 'notes'), async (req, res) => {
  try {
    const { name, phone, email, purpose, notes } = req.body;
    const dummyUserId = '000000000000000000000000';

    const lead = await Lead.create({
      agentId: null,
      callId: null,
      userId: dummyUserId,
      name: name || null,
      phone: phone || null,
      email: email || null,
      purpose: purpose || null,
      notes: notes || null,
      leadType: 'public',
    });

    res.status(201).json({ lead, message: 'Details submitted successfully!' });
  } catch (error) {
    log.error('create_public_lead_error', { error: error.message });
    res.status(500).json({ message: 'Failed to submit details' });
  }
});

// ─── AUTHENTICATED routes below ──────────────────────────────────────────────
router.use(authenticate);

router.get('/', requireAdmin, async (req, res) => {
  // unchanged — shows all non-dummy leads
  try {
    const { page, limit, skip } = parsePage(req.query);
    const dummyUserId = '000000000000000000000000';
    const filter = { userId: { $ne: dummyUserId } };
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).populate('agentId', 'name').skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    const result = leads.map(l => ({
      ...l, id: l._id,
      agentName: l.agentId?.name || null,
      agentId: l.agentId?._id || l.agentId,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_all_leads_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
});

router.get('/public-leads', requireAdmin, async (req, res) => {
  // Admin-only view of AI assistant leads
  try {
    const { page, limit, skip } = parsePage(req.query);
    const dummyUserId = '000000000000000000000000';
    const filter = { userId: dummyUserId };
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    const result = leads.map(l => ({
      ...l,
      id: l._id,
      agentName: null,
      agentId: null,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_public_leads_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch public leads' });
  }
});

router.get('/my', async (req, res) => {
  // User sees only their own leads, filtered by plan type
  try {
    const { page, limit, skip } = parsePage(req.query);
    const user = req.user;
    const filter = { 
      userId: user.userId,
      leadType: { $ne: 'public' },
    };

    // Filter by plan: chat-only shows 'chat' leads, voice-only shows 'call' leads
    if (user.chatPlan && user.chatPlan !== 'none' && (!user.voicePlan || user.voicePlan === 'none')) {
      filter.leadType = 'chat';
    } else if (user.voicePlan && user.voicePlan !== 'none' && (!user.chatPlan || user.chatPlan === 'none')) {
      filter.leadType = 'call';
    }
    // both plans: no leadType filter (shows all)
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).populate('agentId', 'name').skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    const result = leads.map(l => ({
      ...l, id: l._id,
      agentName: l.agentId?.name || 'Chat',
      agentId: l.agentId?._id || l.agentId,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_my_leads_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
});

router.get('/export', async (req, res) => {
  // unchanged
  try {
    const leads = await Lead.find({ userId: req.user.userId, leadType: { $ne: 'public' } })
      .sort({ createdAt: -1 })
      .populate('agentId', 'name')
      .lean();

    const csv = [
      'Name,Phone,Email,Purpose,Agent,Created At',
      ...leads.map(l =>
        `"${l.name || ''}","${l.phone || ''}","${l.email || ''}","${l.purpose || ''}","${l.agentId?.name || ''}","${l.createdAt || ''}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    log.error('export_leads_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to export leads' });
  }
});

router.post('/', contentFilter('name', 'purpose', 'notes'), async (req, res) => {
  // MyChat and call-based leads — always tied to a real user
  try {
    const { agentId, callId, name, phone, email, purpose, notes } = req.body;

    let userId = req.user.userId;
    if (agentId) {
      const agent = await Agent.findById(agentId).lean();
      if (agent) userId = agent.userId;
    }

    const lead = await Lead.create({
      agentId: agentId || null,
      callId: callId || null,
      userId,
      name: name || null,
      phone: phone || null,
      email: email || null,
      purpose: purpose || null,
      notes: notes || null,
      leadType: 'call',
    });

    res.status(201).json({ lead });
  } catch (error) {
    log.error('create_lead_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create lead' });
  }
});

router.put('/:id', requireValidObjectId('id'), contentFilter('notes'), async (req, res) => {
  // unchanged
  try {
    const { id } = req.params;
    const { notes, status } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (lead.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {};
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    const updated = await Lead.findByIdAndUpdate(id, updates, { new: true })
      .populate('agentId', 'name')
      .lean();

    res.json({
      lead: {
        ...updated,
        id: updated._id,
        agentName: updated.agentId?.name || "Chat",
        agentId: updated.agentId?._id || updated.agentId,
      },
    });
  } catch (error) {
    log.error('update_lead_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to update lead' });
  }
});

export default router;