import mongoose from 'mongoose';
import express from 'express';
import BulkCampaign from '../db/models/BulkCampaign.js';
import Agent from '../db/models/Agent.js';
import User from '../db/models/User.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { log } from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { startCampaign, pauseCampaign, cancelCampaign, isCampaignActive } from '../services/bulkCallWorker.js';
import { encrypt } from '../services/encryption.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('voice'));

// POST /bulk-calls — create a campaign
router.post('/', async (req, res) => {
  try {
    const { agentId, name, numbers, concurrency, delayMs, twilioPhoneNumber, twilioAccountSid, twilioAuthToken } = req.body;

    if (!agentId || !name || !numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ message: 'agentId, name, and numbers[] are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ message: 'Invalid agent ID' });
    }

    const agent = await Agent.findById(agentId).lean();
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    if (agent.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!agent.isActive) {
      return res.status(400).json({ message: 'Agent is not active' });
    }

    // Validate and clean numbers
    const cleanNumbers = numbers.map((entry) => {
      const phone = typeof entry === 'string' ? entry : entry.phone;
      const nameVal = typeof entry === 'string' ? null : entry.name || null;
      const cleaned = (phone || '').replace(/[\s\-()]/g, '');
      return { phone: cleaned, name: nameVal, status: 'pending' };
    }).filter(n => /^\+?\d{7,15}$/.test(n.phone));

    if (cleanNumbers.length === 0) {
      return res.status(400).json({ message: 'No valid phone numbers provided' });
    }

    // Check plan limits
    const user = await User.findById(req.user.userId).lean();
    if (user) {
      const planKey = user.voicePlan || user.plan || 'voice_free';
      const planCfg = User.PLAN_CONFIG[planKey];
      if (planCfg && planCfg.limits.calls !== -1) {
        const remaining = planCfg.limits.calls - (user.callsUsed || 0);
        if (remaining <= 0) {
          return res.status(403).json({ message: 'Call limit reached. Please upgrade your plan.' });
        }
        if (cleanNumbers.length > remaining) {
          return res.status(403).json({
            message: `Campaign has ${cleanNumbers.length} numbers but only ${remaining} calls remaining in your plan`,
          });
        }
      }
    }

    const campaign = await BulkCampaign.create({
      userId: req.user.userId,
      agentId,
      name,
      numbers: cleanNumbers,
      concurrency: Math.min(Math.max(parseInt(concurrency, 10) || 1, 1), 5),
      delayMs: Math.max(parseInt(delayMs, 10) || 2000, 0),
      totalCount: cleanNumbers.length,
      twilioPhoneNumber: twilioPhoneNumber || null,
      twilioAccountSid: twilioAccountSid ? encrypt(twilioAccountSid) : null,
      twilioAuthToken: twilioAuthToken ? encrypt(twilioAuthToken) : null,
    });

    res.status(201).json({ campaign });
  } catch (error) {
    log.error('create_bulk_campaign_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create campaign' });
  }
});

// GET /bulk-calls/my — list user's campaigns
router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const filter = { userId: req.user.userId };

    const [campaigns, total] = await Promise.all([
      BulkCampaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('agentId', 'name').lean(),
      BulkCampaign.countDocuments(filter),
    ]);

    const result = campaigns.map(c => ({
      ...c,
      id: c._id,
      agentName: c.agentId?.name || null,
      agentId: c.agentId?._id || c.agentId,
      activeNumbers: c.numbers.filter(n => n.status === 'calling').length,
      pendingNumbers: c.numbers.filter(n => n.status === 'pending').length,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_my_bulk_campaigns_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

// GET /bulk-calls/:id — campaign details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    const campaign = await BulkCampaign.findById(id).populate('agentId', 'name').lean();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      campaign: {
        ...campaign,
        id: campaign._id,
        agentName: campaign.agentId?.name || null,
        agentId: campaign.agentId?._id || campaign.agentId,
      },
    });
  } catch (error) {
    log.error('get_bulk_campaign_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch campaign' });
  }
});

// POST /bulk-calls/:id/start — start a campaign
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    const campaign = await BulkCampaign.findById(id).lean();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      return res.status(400).json({ message: `Cannot start campaign with status: ${campaign.status}` });
    }

    await startCampaign(id);
    res.json({ message: 'Campaign started' });
  } catch (error) {
    log.error('start_bulk_campaign_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: error.message || 'Failed to start campaign' });
  }
});

// POST /bulk-calls/:id/pause — pause a running campaign
router.post('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    const campaign = await BulkCampaign.findById(id).lean();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (campaign.status !== 'running') {
      return res.status(400).json({ message: 'Campaign is not running' });
    }

    pauseCampaign(id);
    res.json({ message: 'Campaign paused' });
  } catch (error) {
    log.error('pause_bulk_campaign_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to pause campaign' });
  }
});

// POST /bulk-calls/:id/cancel — cancel a campaign
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    const campaign = await BulkCampaign.findById(id).lean();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    cancelCampaign(id);
    await BulkCampaign.findByIdAndUpdate(id, { status: 'cancelled', completedAt: new Date() });
    res.json({ message: 'Campaign cancelled' });
  } catch (error) {
    log.error('cancel_bulk_campaign_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to cancel campaign' });
  }
});

// DELETE /bulk-calls/:id — delete a campaign instantly
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    const campaign = await BulkCampaign.findById(id).lean();
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Stop active in-memory background worker immediately if running
    cancelCampaign(id);

    await BulkCampaign.findByIdAndDelete(id);
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    log.error('delete_bulk_campaign_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to delete campaign' });
  }
});

export default router;
