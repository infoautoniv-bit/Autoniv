import express from 'express';
import UpgradeRequest from '../db/models/UpgradeRequest.js';
import User from '../db/models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import log from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { notifyPlanChange } from '../services/planNotifier.js';
import { PLAN_CONFIG } from '../services/planResolver.js';

const router = express.Router();
router.use(authenticate);

const VALID_UPGRADE_PLANS = [
  'chat_free', 'chat_starter', 'chat_growth', 'chat_enterprise',
  'voice_free', 'voice_starter', 'voice_growth', 'voice_enterprise',
  'both_free', 'both_starter', 'both_growth', 'both_enterprise',
  'free', 'starter', 'growth', 'enterprise'
];

/**
  * POST /api/upgrade-requests - Submit a new upgrade request
  */
router.post('/', async (req, res) => {
  try {
    const { requestedPlan } = req.body;
    if (!requestedPlan || !VALID_UPGRADE_PLANS.includes(requestedPlan)) {
      return res.status(400).json({ message: `Invalid plan. Must be one of: ${VALID_UPGRADE_PLANS.join(', ')}` });
    }

    const userId = req.user?.userId || req.user?._id;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Determine current plan for channel (chat/voice/both)
    const userChatPlan = user.chatPlan || 'chat_free';
    const userVoicePlan = user.voicePlan && user.voicePlan !== 'none' ? user.voicePlan : 'voice_free';
    
    let currentPlanForCategory = user.plan || 'chat_free';
    if (requestedPlan.startsWith('chat_')) {
      currentPlanForCategory = userChatPlan;
    } else if (requestedPlan.startsWith('voice_')) {
      currentPlanForCategory = userVoicePlan;
    } else if (requestedPlan.startsWith('both_')) {
      currentPlanForCategory = user.plan || 'both_free';
    }

    if (currentPlanForCategory === requestedPlan) {
      return res.status(400).json({ message: `You are already on the ${requestedPlan} plan` });
    }

    // Check for existing pending upgrade request
    const existingPending = await UpgradeRequest.findOne({ userId: user._id, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ message: 'You already have an upgrade request pending admin approval.' });
    }

    // Create upgrade request record
    const request = await UpgradeRequest.create({
      userId: user._id,
      currentPlan: currentPlanForCategory,
      requestedPlan,
      status: 'pending',
    });

    log.info(`[Upgrade Requests] Created new request for user ${user._id} (${user.email}): ${currentPlanForCategory} -> ${requestedPlan}`);

    res.status(201).json({
      message: 'Upgrade request submitted successfully. Awaiting admin review.',
      request: { ...request.toObject(), id: request._id },
    });
  } catch (error) {
    log.error('create_upgrade_request_error', { error: error.message, userId: req.user?.userId || req.user?._id });
    res.status(500).json({ message: 'Failed to create upgrade request' });
  }
});

/**
  * GET /api/upgrade-requests/my - Get upgrade request history for current user
  */
router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const userId = req.user?.userId || req.user?._id;
    const filter = { userId };
    const [requests, total] = await Promise.all([
      UpgradeRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UpgradeRequest.countDocuments(filter),
    ]);
    res.json(paginatedResponse({ items: requests, total, page, limit }));
  } catch (error) {
    log.error('get_my_upgrade_requests_error', { error: error.message, userId: req.user?.userId || req.user?._id });
    res.status(500).json({ message: 'Failed to fetch upgrade requests' });
  }
});

/**
  * GET /api/upgrade-requests - List upgrade requests for Admin Dashboard
  */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      UpgradeRequest.find(filter).populate('userId', 'name email company').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UpgradeRequest.countDocuments(filter),
    ]);

    const result = requests.map(r => ({
      ...r,
      id: r._id,
      userName: r.userId?.name || null,
      userEmail: r.userId?.email || null,
      userCompany: r.userId?.company || null,
      userId: r.userId?._id || r.userId || null,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_upgrade_requests_error', { error: error.message, userId: req.user?.userId || req.user?._id });
    res.status(500).json({ message: 'Failed to fetch upgrade requests' });
  }
});

/**
  * PUT /api/upgrade-requests/:id - Admin Approve or Reject an upgrade request
  */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user?.userId || req.user?._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    }

    const request = await UpgradeRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Upgrade request not found' });
    }

    // Idempotency check: if already processed, return clean response
    if (request.status !== 'pending') {
      const result = { ...request.toObject(), id: request._id, status: request.status };
      return res.json({ message: `Request is already ${request.status}`, request: result });
    }

    // Process plan upgrade on Admin Approval
    if (status === 'approved' && request.userId) {
      try {
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
          } else if (VALID_UPGRADE_PLANS.includes(plan)) {
            chatPlan = `chat_${plan}`;
            voicePlan = `voice_${plan}`;
          }

          const chatConfig = (chatPlan !== 'none' && PLAN_CONFIG[chatPlan]) ? PLAN_CONFIG[chatPlan] : null;
          const voiceConfig = (voicePlan !== 'none' && PLAN_CONFIG[voicePlan]) ? PLAN_CONFIG[voicePlan] : null;

          let planLegacy = plan;
          if (plan.startsWith('both_')) {
            const chatTier = chatPlan.replace('chat_', '');
            const voiceTier = voicePlan.replace('voice_', '');
            planLegacy = chatTier === voiceTier ? `both_${chatTier}` : plan;
          } else if (plan.startsWith('chat_')) {
            planLegacy = chatPlan;
          } else if (plan.startsWith('voice_')) {
            planLegacy = voicePlan;
          }

          // Atomic update of user account plan and quota limits
          await User.findByIdAndUpdate(request.userId, {
            plan: planLegacy,
            chatPlan,
            voicePlan,
            chatEnabled: chatPlan !== 'none',
            voiceEnabled: voicePlan !== 'none',
            callsLimit: voiceConfig?.limits?.calls ?? 100,
            minutesLimit: voiceConfig?.limits?.minutes ?? 100,
            chatLimit: chatConfig?.limits?.conversations ?? 1000,
            planUpdatedAt: new Date(),
          });

          // Dispatch real-time plan change event
          notifyPlanChange(request.userId, {
            plan: planLegacy,
            chatPlan,
            voicePlan,
            chatEnabled: chatPlan !== 'none',
            voiceEnabled: voicePlan !== 'none',
          }).catch((err) => log.warn('notifyPlanChange error', { error: err.message }));

          log.info(`[Upgrade Requests] Approved & updated user ${request.userId} to ${planLegacy} (${chatPlan}/${voicePlan})`);
        }
      } catch (userUpErr) {
        log.warn('user_plan_upgrade_warning', { error: userUpErr.message, userId: request.userId });
      }
    }

    // Atomic update of UpgradeRequest status
    const updatedRequest = await UpgradeRequest.findByIdAndUpdate(
      id,
      {
        status,
        processedAt: new Date(),
        processedBy: adminId,
      },
      { new: true }
    );

    const responseRequest = {
      ...(updatedRequest ? updatedRequest.toObject() : request.toObject()),
      id: request._id,
      status,
    };

    log.info(`[Upgrade Requests] Admin ${adminId} marked request ${id} as ${status}`);
    res.json({
      message: `Upgrade request successfully ${status}.`,
      request: responseRequest,
    });
  } catch (error) {
    log.error('process_upgrade_request_error', { error: error.message, id: req.params?.id });
    res.status(500).json({ message: error.message || 'Failed to process request' });
  }
});

export default router;