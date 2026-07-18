import express from 'express';
import UpgradeRequest from '../db/models/UpgradeRequest.js';
import User from '../db/models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { log } from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { notifyPlanChange } from '../services/planNotifier.js';

const router = express.Router();
router.use(authenticate);

const VALID_UPGRADE_PLANS = [
  'chat_starter', 'chat_growth', 'chat_enterprise',
  'voice_starter', 'voice_growth', 'voice_enterprise',
  'both_starter', 'both_growth', 'both_enterprise',
  'starter', 'growth', 'enterprise' // backward compatibility
];

router.post('/', async (req, res) => {
  try {
    const { requestedPlan } = req.body;
    if (!VALID_UPGRADE_PLANS.includes(requestedPlan)) {
      return res.status(400).json({ message: `Plan must be one of: ${VALID_UPGRADE_PLANS.join(', ')}` });
    }

    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.plan === requestedPlan) {
      return res.status(400).json({ message: `You are already on the ${requestedPlan} plan` });
    }

    const existing = await UpgradeRequest.findOne({ userId: user._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending upgrade request' });
    }

    const request = await UpgradeRequest.create({
      userId: user._id,
      currentPlan: user.plan,
      requestedPlan,
      status: 'pending',
    });

    res.status(201).json({ request });
  } catch (error) {
    log.error('create_upgrade_request_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create upgrade request' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const filter = { userId: req.user.userId };
    const [requests, total] = await Promise.all([
      UpgradeRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UpgradeRequest.countDocuments(filter),
    ]);
    res.json(paginatedResponse({ items: requests, total, page, limit }));
  } catch (error) {
    log.error('get_my_upgrade_requests_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch upgrade requests' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      UpgradeRequest.find(filter).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UpgradeRequest.countDocuments(filter),
    ]);

    const result = requests.map(r => ({
      ...r,
      id: r._id,
      userName: r.userId?.name || null,
      userEmail: r.userId?.email || null,
      userId: r.userId?._id || r.userId,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_upgrade_requests_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch upgrade requests' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    }

    const request = await UpgradeRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Upgrade request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request was already ${request.status}` });
    }

    request.status = status;
    await request.save();

    if (status === 'approved') {
      const plan = request.requestedPlan;
      const user = await User.findById(request.userId).lean();
      if (user) {
        let chatPlan = user.chatPlan || 'chat_free';
        let voicePlan = user.voicePlan || 'none';

        if (plan.startsWith('chat_')) {
          chatPlan = plan;
        } else if (plan.startsWith('voice_')) {
          voicePlan = plan;
        } else if (plan.startsWith('both_')) {
          chatPlan = plan.replace('both_', 'chat_');
          voicePlan = plan.replace('both_', 'voice_');
        } else if (User.VALID_PLANS.includes(plan)) {
          chatPlan = `chat_${plan}`;
          voicePlan = `voice_${plan}`;
        }

        const chatConfig = (chatPlan !== 'none' && User.PLAN_CONFIG[chatPlan]) ? User.PLAN_CONFIG[chatPlan] : null;
        const voiceConfig = (voicePlan !== 'none' && User.PLAN_CONFIG[voicePlan]) ? User.PLAN_CONFIG[voicePlan] : null;

        let planLegacy = plan;
        if (chatPlan !== 'none' && voicePlan !== 'none') {
          const chatTier = chatPlan.replace('chat_', '');
          const voiceTier = voicePlan.replace('voice_', '');
          planLegacy = chatTier === voiceTier ? `both_${chatTier}` : chatPlan;
        } else if (chatPlan !== 'none') {
          planLegacy = chatPlan;
        } else if (voicePlan !== 'none') {
          planLegacy = voicePlan;
        }

        await User.findByIdAndUpdate(request.userId, {
          plan: planLegacy,
          chatPlan,
          voicePlan,
          chatEnabled: chatPlan !== 'none',
          voiceEnabled: voicePlan !== 'none',
          callsLimit: voiceConfig ? voiceConfig.limits.calls : 0,
          minutesLimit: voiceConfig ? voiceConfig.limits.minutes : 0,
          chatLimit: chatConfig ? chatConfig.limits.conversations : 0,
        });

        notifyPlanChange(request.userId, {
          plan: planLegacy,
          chatPlan,
          voicePlan,
          chatEnabled: chatPlan !== 'none',
          voiceEnabled: voicePlan !== 'none',
          callsLimit: voiceConfig ? voiceConfig.limits.calls : 0,
          minutesLimit: voiceConfig ? voiceConfig.limits.minutes : 0,
          chatLimit: chatConfig ? chatConfig.limits.conversations : 0,
        });
      }
    }

    res.json({ request });
  } catch (error) {
    log.error('process_upgrade_request_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to process upgrade request' });
  }
});

export default router;
