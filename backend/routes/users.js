import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User, { hashApiKey, generateApiKey } from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import UpgradeRequest from '../db/models/UpgradeRequest.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requireValidObjectId } from '../middleware/validators.js';
import { contentFilter } from '../services/contentModeration.js';
import { log, securityEvent } from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { deleteRecordings } from '../services/cloudinary.js';
import {
  isValidEmail,
  passwordError,
  normalizeEmail,
  trimString,
} from '../services/validators.js';

const router = express.Router();
router.use(authenticate);

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { period } = req.query;
    let dateFilter = {};
    if (period) {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter = { $or: [{ startedAt: { $gte: startDate } }, { endedAt: { $gte: startDate } }] };
    }

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    const callAggFilter = Object.keys(dateFilter).length > 0 ? dateFilter : {};
    const userIds = users.map(u => u._id);
    const callAgg = userIds.length > 0
      ? await Call.aggregate([
        { $match: { ...callAggFilter, userId: { $in: userIds } } },
        { $group: { _id: '$userId', callCount: { $sum: 1 }, calcMinutes: { $sum: { $divide: [{ $subtract: ['$endedAt', '$startedAt'] }, 60000] } }, lastCallAt: { $max: '$startedAt' }, lastCallEnded: { $max: '$endedAt' } } },
      ])
      : [];
    const callMap = {};
    for (const c of callAgg) {
      callMap[c._id?.toString()] = c;
    }

    const result = users.map(u => {
      const stats = callMap[u._id.toString()] || {};
      let chatPlan = u.chatPlan;
      let voicePlan = u.voicePlan;
      if (!chatPlan || chatPlan === 'none') {
        const p = u.plan || 'chat_free';
        if (p.startsWith('chat_')) {
          chatPlan = p;
          voicePlan = voicePlan || 'none';
        } else if (p.startsWith('voice_')) {
          chatPlan = 'none';
          voicePlan = p;
        } else if (p.startsWith('both_')) {
          chatPlan = p.replace('both_', 'chat_');
          voicePlan = p.replace('both_', 'voice_');
        } else {
          chatPlan = `chat_${p}`;
          voicePlan = `voice_${p}`;
        }
      }
      if (!voicePlan || voicePlan === 'none') {
        const p = u.plan || 'chat_free';
        if (p.startsWith('voice_')) voicePlan = p;
        else if (p.startsWith('both_')) voicePlan = p.replace('both_', 'voice_');
        else voicePlan = `voice_${p}`;
      }
      chatPlan = chatPlan || 'none';
      voicePlan = voicePlan || 'none';

      return {
        id: u._id, email: u.email, name: u.name, phoneNumber: u.phoneNumber,
        role: u.role, company: u.company, plan: u.plan || chatPlan,
        chatPlan, voicePlan,
        minutesUsed: u.minutesUsed,
        minutesLimit: voicePlan !== 'none' && User.PLAN_CONFIG[voicePlan] ? User.PLAN_CONFIG[voicePlan].limits.minutes : u.minutesLimit,
        callsUsed: u.callsUsed || 0,
        callsLimit: voicePlan !== 'none' && User.PLAN_CONFIG[voicePlan] ? User.PLAN_CONFIG[voicePlan].limits.calls : u.callsLimit,
        chatUsed: u.chatUsed || 0,
        chatLimit: chatPlan !== 'none' && User.PLAN_CONFIG[chatPlan] ? User.PLAN_CONFIG[chatPlan].limits.conversations : (u.chatLimit || 0),
        isActive: u.isActive, createdAt: u.createdAt,
        callCount: stats.callCount || 0,
        calcMinutes: Math.round(stats.calcMinutes || 0),
        lastCallAt: stats.lastCallAt || null,
        lastCallEnded: stats.lastCallEnded || null,
        chatEnabled: chatPlan !== 'none',
        voiceEnabled: voicePlan !== 'none',
      };
    });

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_users_error', { error: error.message, userId: req.user.userId });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.post('/', requireAdmin, contentFilter('name', 'company'), async (req, res) => {
  try {
    const name = trimString(req.body?.name, 100);
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const company = trimString(req.body?.company, 200);
    const phoneNumber = trimString(req.body?.phoneNumber, 30);
    const chatPlan = typeof req.body?.chatPlan === 'string' ? req.body.chatPlan : 'chat_free';
    const voicePlan = typeof req.body?.voicePlan === 'string' ? req.body.voicePlan : 'none';

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });
    const pwdErr = passwordError(password);
    if (pwdErr) return res.status(400).json({ message: pwdErr });

    if (chatPlan !== 'none' && !User.PLAN_CONFIG[chatPlan]) return res.status(400).json({ message: 'Invalid Chat plan' });
    if (voicePlan !== 'none' && !User.PLAN_CONFIG[voicePlan]) return res.status(400).json({ message: 'Invalid Voice plan' });

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const chatConfig = (chatPlan !== 'none' && User.PLAN_CONFIG[chatPlan]) ? User.PLAN_CONFIG[chatPlan] : null;
    const voiceConfig = (voicePlan !== 'none' && User.PLAN_CONFIG[voicePlan]) ? User.PLAN_CONFIG[voicePlan] : null;

    let plan = 'chat_free';
    if (chatPlan !== 'none' && voicePlan !== 'none') {
      const chatTier = chatPlan.replace('chat_', '');
      const voiceTier = voicePlan.replace('voice_', '');
      plan = chatTier === voiceTier ? `both_${chatTier}` : chatPlan;
    } else if (chatPlan !== 'none') {
      plan = chatPlan;
    } else if (voicePlan !== 'none') {
      plan = voicePlan;
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      company,
      plan,
      chatPlan,
      voicePlan,
      chatEnabled: chatPlan !== 'none',
      voiceEnabled: voicePlan !== 'none',
      passwordChangedAt: new Date(),
    });

    res.json({
      user: {
        id: user._id, email: user.email, name: user.name,
        phoneNumber: user.phoneNumber, role: user.role, company: user.company,
        plan: user.plan, chatPlan: user.chatPlan, voicePlan: user.voicePlan,
        minutesUsed: user.minutesUsed,
        minutesLimit: user.voicePlan !== 'none' && User.PLAN_CONFIG[user.voicePlan] ? User.PLAN_CONFIG[user.voicePlan].limits.minutes : user.minutesLimit,
        callsUsed: user.callsUsed || 0,
        callsLimit: user.voicePlan !== 'none' && User.PLAN_CONFIG[user.voicePlan] ? User.PLAN_CONFIG[user.voicePlan].limits.calls : user.callsLimit,
        chatUsed: user.chatUsed || 0,
        chatLimit: user.chatPlan !== 'none' && User.PLAN_CONFIG[user.chatPlan] ? User.PLAN_CONFIG[user.chatPlan].limits.conversations : (user.chatLimit || 0),
        isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt,
        chatEnabled: user.chatPlan !== 'none', voiceEnabled: user.voicePlan !== 'none',
      },
    });
  } catch (error) {
    log.error('create_user_error', { error: error.message, userId: req.user.userId });
    res.status(500).json({ message: 'Failed to create user' });
  }
});

router.put('/:id', requireValidObjectId('id'), contentFilter('name', 'company'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, company, password, oldPassword, phoneNumber, chatPlan, voicePlan } = req.body;

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const isSelf = req.user.role !== 'admin';
    const currentChatPlan = isSelf ? (user.chatPlan || 'chat_free') : (chatPlan !== undefined ? chatPlan : (user.chatPlan || 'chat_free'));
    const currentVoicePlan = isSelf ? (user.voicePlan || 'none') : (voicePlan !== undefined ? voicePlan : (user.voicePlan || 'none'));

    const chatConfig = (currentChatPlan !== 'none' && User.PLAN_CONFIG[currentChatPlan]) ? User.PLAN_CONFIG[currentChatPlan] : null;
    const voiceConfig = (currentVoicePlan !== 'none' && User.PLAN_CONFIG[currentVoicePlan]) ? User.PLAN_CONFIG[currentVoicePlan] : null;

    let planLegacy = user.plan;
    if (!isSelf && (chatPlan !== undefined || voicePlan !== undefined)) {
      if (currentChatPlan !== 'none' && currentVoicePlan !== 'none') {
        const chatTier = currentChatPlan.replace('chat_', '');
        const voiceTier = currentVoicePlan.replace('voice_', '');
        planLegacy = chatTier === voiceTier ? `both_${chatTier}` : currentChatPlan;
      } else if (currentChatPlan !== 'none') {
        planLegacy = currentChatPlan;
      } else if (currentVoicePlan !== 'none') {
        planLegacy = currentVoicePlan;
      } else {
        planLegacy = 'chat_free';
      }
    }

    const updates = {
      name: typeof name === 'string' ? name.trim().slice(0, 100) : user.name,
      email: email ? String(email).toLowerCase().trim().slice(0, 254) : user.email,
      phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim().slice(0, 30) : user.phoneNumber,
      company: typeof company === 'string' ? company.trim().slice(0, 200) : user.company,
      plan: planLegacy,
    };

    if (req.user.role === 'admin') {
      updates.chatPlan = currentChatPlan;
      updates.voicePlan = currentVoicePlan;
      updates.chatEnabled = currentChatPlan !== 'none';
      updates.voiceEnabled = currentVoicePlan !== 'none';
      if (voiceConfig) {
        updates.callsLimit = voiceConfig.limits.calls;
        updates.minutesLimit = voiceConfig.limits.minutes;
      }
      if (chatConfig) {
        updates.chatLimit = chatConfig.limits.conversations;
      }
    }

    if (password) {
      if (isSelf) {
        if (!oldPassword) {
          return res.status(400).json({ message: 'Current password is required to change your password' });
        }
        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }
      const pwdErr = passwordError(password);
      if (pwdErr) return res.status(400).json({ message: pwdErr });
      updates.password = await bcrypt.hash(password, 12);
      updates.passwordChangedAt = new Date();
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).lean();

    res.json({
      user: {
        id: updated._id, email: updated.email, name: updated.name,
        phoneNumber: updated.phoneNumber, role: updated.role, company: updated.company,
        plan: updated.plan, chatPlan: updated.chatPlan, voicePlan: updated.voicePlan,
        minutesUsed: updated.minutesUsed,
        minutesLimit: updated.voicePlan !== 'none' && User.PLAN_CONFIG[updated.voicePlan] ? User.PLAN_CONFIG[updated.voicePlan].limits.minutes : updated.minutesLimit,
        callsUsed: updated.callsUsed || 0,
        callsLimit: updated.voicePlan !== 'none' && User.PLAN_CONFIG[updated.voicePlan] ? User.PLAN_CONFIG[updated.voicePlan].limits.calls : updated.callsLimit,
        chatUsed: updated.chatUsed || 0,
        chatLimit: updated.chatPlan !== 'none' && User.PLAN_CONFIG[updated.chatPlan] ? User.PLAN_CONFIG[updated.chatPlan].limits.conversations : (updated.chatLimit || 0),
        isActive: updated.isActive, createdAt: updated.createdAt, updatedAt: updated.updatedAt,
        chatEnabled: updated.chatPlan !== 'none', voiceEnabled: updated.voicePlan !== 'none',
      },
    });
  } catch (error) {
    log.error('update_user_error', { error: error.message, userId: req.user.userId });
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.delete('/:id', requireValidObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role !== 'admin' && req.user.userId === id) {
      const target = await User.findById(id).select('role').lean();
      if (target?.role === 'admin') {
        return res.status(403).json({ message: 'Admin accounts cannot self-delete' });
      }
    }

    const callsToDelete = await Call.find({ userId: id }).select('recordingUrl').lean();
    await deleteRecordings(callsToDelete.map(c => c.recordingUrl));

    await Appointment.deleteMany({ userId: id });
    await Lead.deleteMany({ userId: id });
    await Call.deleteMany({ userId: id });

    const agents = await Agent.find({ userId: id }).lean();
    for (const agent of agents) {
      if (agent.phoneNumberId) {
        try {
          const { assignAgentToPhone } = await import('../services/vapi.js');
          await assignAgentToPhone(agent.phoneNumberId, null);
        } catch { /* proceed */ }
      }
      if (agent.vapiId) {
        try {
          const { deleteVapiAssistant } = await import('../services/vapi.js');
          await deleteVapiAssistant(agent.vapiId);
        } catch { /* proceed */ }
      }
    }
    await Agent.deleteMany({ userId: id });
    await UpgradeRequest.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    securityEvent('user_deleted', { deletedId: id, byUser: req.user.userId });
    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    log.error('delete_user_error', { error: error.message, userId: req.user.userId });
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.put('/:id/block', requireValidObjectId('id'), requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    await User.findByIdAndUpdate(id, { isActive });
    res.json({ message: 'User updated' });
  } catch (error) {
    log.error('block_user_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.put('/:id/plan', requireValidObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    let { plan, chatPlan, voicePlan } = req.body;

    if (req.user.role !== 'admin' && req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (plan && chatPlan === undefined && voicePlan === undefined) {
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
    }

    const updates = {};
    if (chatPlan) {
      if (chatPlan !== 'none' && !User.PLAN_CONFIG[chatPlan]) return res.status(400).json({ message: 'Invalid Chat plan' });
      updates.chatPlan = chatPlan;
      updates.chatEnabled = chatPlan !== 'none';
      const cfg = User.PLAN_CONFIG[chatPlan];
      if (cfg) updates.chatLimit = cfg.limits.conversations;
    }
    if (voicePlan) {
      if (voicePlan !== 'none' && !User.PLAN_CONFIG[voicePlan]) return res.status(400).json({ message: 'Invalid Voice plan' });
      updates.voicePlan = voicePlan;
      updates.voiceEnabled = voicePlan !== 'none';
      const vcfg = User.PLAN_CONFIG[voicePlan];
      if (vcfg) {
        updates.callsLimit = vcfg.limits.calls;
        updates.minutesLimit = vcfg.limits.minutes;
      }
    }

    const finalChat = updates.chatPlan !== undefined ? updates.chatPlan : (user.chatPlan || 'chat_free');
    const finalVoice = updates.voicePlan !== undefined ? updates.voicePlan : (user.voicePlan || 'none');

    if (finalChat !== 'none' && finalVoice !== 'none') {
      const chatTier = finalChat.replace('chat_', '');
      const voiceTier = finalVoice.replace('voice_', '');
      updates.plan = chatTier === voiceTier ? `both_${chatTier}` : finalChat;
    } else if (finalChat !== 'none') {
      updates.plan = finalChat;
    } else if (finalVoice !== 'none') {
      updates.plan = finalVoice;
    } else {
      updates.plan = 'chat_free';
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).lean();

    if (!updated) {
      return res.status(500).json({ message: 'Failed to update plan' });
    }

    res.json({
      user: {
        id: updated._id, email: updated.email, name: updated.name,
        phoneNumber: updated.phoneNumber, role: updated.role, company: updated.company,
        plan: updated.plan, chatPlan: updated.chatPlan, voicePlan: updated.voicePlan,
        minutesUsed: updated.minutesUsed,
        minutesLimit: updated.voicePlan !== 'none' && User.PLAN_CONFIG[updated.voicePlan] ? User.PLAN_CONFIG[updated.voicePlan].limits.minutes : updated.minutesLimit,
        callsUsed: updated.callsUsed || 0,
        callsLimit: updated.voicePlan !== 'none' && User.PLAN_CONFIG[updated.voicePlan] ? User.PLAN_CONFIG[updated.voicePlan].limits.calls : updated.callsLimit,
        chatUsed: updated.chatUsed || 0,
        chatLimit: updated.chatPlan !== 'none' && User.PLAN_CONFIG[updated.chatPlan] ? User.PLAN_CONFIG[updated.chatPlan].limits.conversations : (updated.chatLimit || 0),
        isActive: updated.isActive, createdAt: updated.createdAt, updatedAt: updated.updatedAt,
        chatEnabled: updated.chatPlan !== 'none', voiceEnabled: updated.voicePlan !== 'none',
      },
    });
  } catch (error) {
    log.error('upgrade_plan_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to upgrade plan' });
  }
});

// ─── API Key management ─────────────────────────────────────────────────────
// Keys are stored as SHA-256 hashes. Plain text is only returned at generation time.

router.get('/api-key', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('+apiKey').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Return masked key for display — full key only shown at creation
    const hasKey = !!user.apiKey;
    res.json({ apiKey: hasKey ? 'ak_••••••••••••••••••••••••' : null, hasKey });
  } catch (error) {
    log.error('get_api_key_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to get API key' });
  }
});

router.post('/api-key/regenerate', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('+apiKey');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate new plain text key, hash it, store hash
    const plainKey = generateApiKey();
    user.apiKey = hashApiKey(plainKey);
    await user.save();

    // Return plain text ONLY here — user must save it now
    res.json({ apiKey: plainKey, message: 'Save this key — it will not be shown again.' });
  } catch (error) {
    log.error('regenerate_api_key_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to regenerate API key' });
  }
});

export default router;
