import mongoose from 'mongoose';
import express from 'express';
import Agent from '../db/models/Agent.js';
import User from '../db/models/User.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import { authenticate, requireAdmin, requireFeature } from '../middleware/auth.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { deleteRecordings } from '../services/cloudinary.js';
import {
  createVapiAssistant,
  updateVapiAssistant,
  deleteVapiAssistant,
  assignAgentToPhone,
  createVapiPhoneNumber,
  listVapiPhoneNumbers,
} from '../services/vapi.js';
import { encrypt, decrypt } from '../services/encryption.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('voice'));

const VALID_TYPES = ['receptionist', 'appointment', 'faq'];

function normalizeAgent(agent) {
  if (!agent) return null;
  const obj = agent.toObject ? agent.toObject() : { ...agent };
  obj.id = obj._id ? obj._id.toString() : obj.id;
  if (obj.userId) obj.userId = obj.userId.toString();
  if (obj.twilioAccountSid) obj.twilioAccountSid = decrypt(obj.twilioAccountSid);
  if (obj.twilioAuthToken) obj.twilioAuthToken = decrypt(obj.twilioAuthToken);
  return obj;
}

async function resolveAgentForUser(id, user) {
  if (!mongoose.Types.ObjectId.isValid(id)) return { agent: null, forbidden: false };
  const agent = await Agent.findById(id).lean();
  if (!agent) return { agent: null, forbidden: false };
  if (user.role === 'admin' || agent.userId.toString() === user.userId) {
    return { agent, forbidden: false };
  }
  return { agent, forbidden: true };
}

// GET /agents — admin: all agents with user info and call count
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'calls',
          localField: '_id',
          foreignField: 'agentId',
          as: 'calls',
        },
      },
      {
        $addFields: {
          callCount: { $size: '$calls' },
          userName: '$user.name',
          userEmail: '$user.email',
        },
      },
      { $project: { user: 0, calls: 0 } },
      { $sort: { createdAt: -1 } },
    ];

    const countPipeline = [{ $count: 'total' }];

    // ✅ Fixed: Promise.all takes an array
    const [agents, countResult] = await Promise.all([
      Agent.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      Agent.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const normalized = (agents || []).map(normalizeAgent);

    res.json(paginatedResponse({ items: normalized, total, page, limit }));
  } catch (err) {
    log.error('get_all_agents_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch agents' });
  }
});

// GET /agents/my — current user's agents
router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);

    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const matchStage = { userId };

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'calls',
          localField: '_id',
          foreignField: 'agentId',
          as: 'calls',
        },
      },
      {
        $addFields: {
          callCount: { $size: '$calls' },
        },
      },
      { $project: { calls: 0 } },
      { $sort: { createdAt: -1 } },
    ];

    const countPipeline = [{ $match: matchStage }, { $count: 'total' }];

    const [agents, countResult] = await Promise.all([
      Agent.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      Agent.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const normalized = (agents || []).map(normalizeAgent);

    res.json(paginatedResponse({ items: normalized, total, page, limit }));
  } catch (err) {
    log.error('get_my_agents_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch agents' });
  }
});

// GET /agents/phone-numbers — authenticated users (allow users to link numbers)
router.get('/phone-numbers', async (req, res) => {
  try {
    const phoneNumbers = await listVapiPhoneNumbers();
    res.json({ phoneNumbers });
  } catch (err) {
    log.error('list_phone_numbers_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: `Failed to list phone numbers: ${err.message}` });
  }
});

// POST /agents/phone-numbers — admin only (to import new numbers)
router.post('/phone-numbers', requireAdmin, async (req, res) => {
  try {
    const {
      provider, phoneNumber, number, assistantId, name,
      twilioAccountSid, twilioAuthToken, twilioApiKey, twilioApiSecret,
      vonageApiKey, vonageApiSecret,
      telnyxApiKey,
      sipGateway, sipUsername, sipPassword, sipTransport,
    } = req.body;
    const phone = number || phoneNumber;
    if (!provider || !phone) {
      return res.status(400).json({ message: 'provider and number are required' });
    }
    const result = await createVapiPhoneNumber({
      provider,
      number: phone,
      assistantId,
      name,
      twilioAccountSid, twilioAuthToken, twilioApiKey, twilioApiSecret,
      vonageApiKey, vonageApiSecret,
      telnyxApiKey,
      sipGateway, sipUsername, sipPassword, sipTransport,
    });
    res.status(201).json({ phoneNumber: result });
  } catch (err) {
    log.error('create_phone_number_error', { error: err.message, userId: req.user?.userId });
    
    // Parse Vapi error status and message
    let status = 500;
    let message = err.message;
    if (err.message.includes('=>')) {
      const parts = err.message.split('=>');
      const codePart = parts[1].trim();
      const codeMatch = codePart.match(/^(\d+):/);
      if (codeMatch) {
        status = parseInt(codeMatch[1], 10);
        message = codePart.substring(codeMatch[0].length).trim();
        try {
          const parsed = JSON.parse(message);
          if (parsed.message) {
            message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
          }
        } catch (_) {}
      }
    }
    res.status(status).json({ message: `Failed to create phone number: ${message}` });
  }
});

// POST /agents — create agent
router.post('/', contentFilter('name', 'prompt'), async (req, res) => {
  try {
    const {
      name,
      type,
      prompt,
      language,
      voiceId,
      useCustomEngine,
      customEngineModel,
      twilioAccountSid,
      twilioAuthToken,
      phoneNumberId,
      phoneNumber,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'name and type are required' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    // Check chatbot limit from plan config
    const PLAN_CONFIG = User.PLAN_CONFIG;
    let chatPlan = user.chatPlan || 'chat_free';
    // Resolve chatPlan from user.plan if current chatPlan is invalid/none
    if (!chatPlan || chatPlan === 'none' || !PLAN_CONFIG[chatPlan]) {
      const p = user.plan || 'chat_free';
      if (p.startsWith('chat_')) chatPlan = p;
      else if (p.startsWith('both_')) chatPlan = p.replace('both_', 'chat_');
      else chatPlan = `chat_${p}`;
    }
    const chatCfg = PLAN_CONFIG[chatPlan];
    if (chatCfg) {
      const maxChatbots = chatCfg.limits.chatbots;
      if (maxChatbots !== -1) {
        const count = await Agent.countDocuments({ userId: user._id });
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

    // Create Vapi assistant only if not using custom engine
    let vapiId = null;
    if (!useCustomEngine) {
      try {
        const vapiAssistant = await createVapiAssistant({
          name,
          type,
          prompt: prompt || null,
          language: language || 'en',
          voiceId: voiceId || null,
          userId: user._id,
          serverUrl: process.env.WEBHOOK_URL || process.env.SERVER_URL,
        });
        vapiId = vapiAssistant.id;
      } catch (vapiErr) {
        log.warn('vapi_create_agent_failed', { error: vapiErr.message, userId: req.user?.userId });
        return res.status(502).json({ message: `Voice agent creation failed: ${vapiErr.message}` });
      }
    }

    const isDirectNumber = phoneNumberId ? (phoneNumberId.startsWith('+') || /^\d+$/.test(phoneNumberId)) : false;

    if (vapiId && phoneNumberId && !isDirectNumber) {
      try {
        await assignAgentToPhone(phoneNumberId, vapiId);
      } catch (vapiErr) {
        log.error('vapi_assign_phone_failed', { error: vapiErr.message, userId: req.user?.userId });
        // Clean up created assistant
        try {
          await deleteVapiAssistant(vapiId);
        } catch (_) {}
        return res.status(502).json({ message: `Failed to assign phone number: ${vapiErr.message}` });
      }
    }

    const agent = await Agent.create({
      userId: user._id,
      vapiId,
      name,
      type,
      prompt: prompt || null,
      language: language || null,
      voiceId: voiceId || null,
      isActive: true,
      useCustomEngine: !!useCustomEngine,
      customEngineModel: customEngineModel || 'groq:llama-3.3-70b',
      twilioAccountSid: twilioAccountSid ? encrypt(twilioAccountSid) : null,
      twilioAuthToken: twilioAuthToken ? encrypt(twilioAuthToken) : null,
      phoneNumberId: isDirectNumber ? null : (phoneNumberId || null),
      phoneNumber: isDirectNumber ? phoneNumberId : (phoneNumber || null),
    });

    res.status(201).json({
      agent: normalizeAgent(agent),
    });
  } catch (err) {
    log.error('create_agent_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create agent' });
  }
});

// PUT /agents/:id — update agent
router.put('/:id', contentFilter('name', 'prompt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, prompt, isActive, language, voiceId, useCustomEngine, customEngineModel, twilioAccountSid, twilioAuthToken } = req.body;

    const { agent, forbidden } = await resolveAgentForUser(id, req.user);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    if (forbidden) return res.status(403).json({ message: 'Access denied' });

    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const effectiveName = name || agent.name;
    const effectiveType = type || agent.type;
    const effectiveLanguage = language || agent.language || 'en';
    const effectiveVoiceId = voiceId || agent.voiceId;
    const userProvidedPrompt = prompt !== undefined && prompt !== null && prompt !== '';
    const languageChanged = language !== undefined && language !== agent.language;
    const promptForVapi = userProvidedPrompt
      ? prompt
      : languageChanged ? null : (agent.prompt || null);

    const configChanged = name !== undefined || type !== undefined || prompt !== undefined || language !== undefined || voiceId !== undefined;

    const isCustom = useCustomEngine !== undefined ? !!useCustomEngine : !!agent.useCustomEngine;

    if (agent.vapiId && configChanged && !isCustom) {
      try {
        await updateVapiAssistant(agent.vapiId, {
          name: effectiveName,
          prompt: promptForVapi,
          type: effectiveType,
          language: effectiveLanguage,
          voiceId: effectiveVoiceId,
          userId: agent.userId,
          serverUrl: process.env.WEBHOOK_URL || process.env.SERVER_URL,
        });
      } catch (vapiErr) {
        log.error('vapi_update_agent_failed', { error: vapiErr.message, userId: req.user?.userId });
        return res.status(502).json({ message: `Voice agent update failed: ${vapiErr.message}` });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (prompt !== undefined) updates.prompt = prompt || null;
    if (isActive !== undefined) updates.isActive = isActive;
    if (language !== undefined) updates.language = language;
    if (voiceId !== undefined) updates.voiceId = voiceId;
    if (useCustomEngine !== undefined) updates.useCustomEngine = useCustomEngine;
    if (customEngineModel !== undefined) updates.customEngineModel = customEngineModel;
    if (twilioAccountSid !== undefined) updates.twilioAccountSid = twilioAccountSid ? encrypt(twilioAccountSid) : null;
    if (twilioAuthToken !== undefined) updates.twilioAuthToken = twilioAuthToken ? encrypt(twilioAuthToken) : null;

    const updated = await Agent.findByIdAndUpdate(id, updates, { new: true }).lean();

    res.json({
      agent: normalizeAgent(updated),
    });
  } catch (err) {
    log.error('update_agent_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to update agent' });
  }
});

// DELETE /agents/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { agent, forbidden } = await resolveAgentForUser(id, req.user);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    if (forbidden) return res.status(403).json({ message: 'Access denied' });

    const objId = new mongoose.Types.ObjectId(id);

    // First, unlink phone number if assigned to prevent Vapi deletion restriction
    if (agent.phoneNumberId) {
      try {
        await assignAgentToPhone(agent.phoneNumberId, null);
      } catch (e) {
        log.warn('vapi_unlink_phone_during_delete_failed', { error: e.message, userId: req.user?.userId });
      }
    }

    // Now delete Vapi assistant and fetch calls to delete
    const [vapiResult, callsToDelete] = await Promise.all([
      agent.vapiId
        ? deleteVapiAssistant(agent.vapiId).catch(e =>
            log.warn('vapi_delete_agent_failed', { error: e.message, userId: req.user?.userId })
          )
        : Promise.resolve(),
      Call.find({ agentId: objId }).select('recordingUrl').lean(),
    ]);

    // Delete recordings and DB records in parallel
    await Promise.all([
      deleteRecordings(callsToDelete.map(c => c.recordingUrl)),
      Lead.deleteMany({ agentId: objId }),
      Appointment.deleteMany({ agentId: objId }),
      Call.deleteMany({ agentId: objId }),
      Agent.findByIdAndDelete(objId),
    ]);

    res.json({ message: 'Agent and all associated data deleted successfully' });
  } catch (err) {
    log.error('delete_agent_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to delete agent' });
  }
});

// POST /agents/:id/assign-phone — admin or agent owner
router.post('/:id/assign-phone', async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken } = req.body;

    if (!phoneNumberId) {
      return res.status(400).json({ message: 'phoneNumberId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid agent ID' });
    }

    const agent = await Agent.findById(id).lean();
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    
    // Check ownership if not admin
    if (req.user.role !== 'admin' && agent.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const isDirectNumber = phoneNumberId.startsWith('+') || /^\d+$/.test(phoneNumberId);

    if (isDirectNumber) {
      // Direct Twilio phone number assignment (bypass Vapi)
      const numberValue = phoneNumberId;
      const updated = await Agent.findByIdAndUpdate(
        id,
        { 
          phoneNumber: numberValue, 
          twilioAccountSid: twilioAccountSid ? encrypt(twilioAccountSid) : null,
          twilioAuthToken: twilioAuthToken ? encrypt(twilioAuthToken) : null,
          $unset: { phoneNumberId: '' } 
        },
        { new: true }
      ).lean();

      return res.json({
        agent: normalizeAgent(updated),
      });
    }

    if (!agent.vapiId) {
      // Agent is a custom/non-Vapi agent; skip Vapi phone assignment and save locally in DB
      const updateFields = { phoneNumberId };
      if (phoneNumber) updateFields.phoneNumber = phoneNumber;
      const updated = await Agent.findByIdAndUpdate(id, updateFields, { new: true }).lean();

      return res.json({
        agent: {
          ...updated,
          id: updated._id.toString(),
          userId: updated.userId.toString(),
        },
      });
    }

    try {
      await assignAgentToPhone(phoneNumberId, agent.vapiId);
    } catch (vapiErr) {
      log.error('vapi_assign_phone_failed', { error: vapiErr.message, userId: req.user?.userId });
      return res.status(502).json({ message: `Vapi error: ${vapiErr.message}` });
    }

    const updateFields = { phoneNumberId };
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (twilioAccountSid) updateFields.twilioAccountSid = encrypt(twilioAccountSid);
    if (twilioAuthToken) updateFields.twilioAuthToken = encrypt(twilioAuthToken);
    const updated = await Agent.findByIdAndUpdate(id, updateFields, { new: true }).lean();

    res.json({
      agent: normalizeAgent(updated),
    });
  } catch (err) {
    log.error('assign_phone_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to assign phone number' });
  }
});

// POST /agents/:id/unlink-phone — admin or agent owner
router.post('/:id/unlink-phone', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid agent ID' });
    }

    const agent = await Agent.findById(id).lean();
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    // Check ownership if not admin
    if (req.user.role !== 'admin' && agent.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!agent.phoneNumberId) {
      return res.status(400).json({ message: 'Agent has no phone number linked' });
    }

    const phoneNumberId = agent.phoneNumberId;

    // Remove assistant assignment from phone number in Vapi
    try {
      await assignAgentToPhone(phoneNumberId, null);
    } catch (vapiErr) {
      log.warn('vapi_unlink_phone_failed', { error: vapiErr.message, userId: req.user?.userId });
    }

    // Remove phoneNumberId, phoneNumber, and Twilio credentials from agent in database
    const updated = await Agent.findByIdAndUpdate(id, { $unset: { phoneNumberId: '', phoneNumber: '', twilioAccountSid: '', twilioAuthToken: '' } }, { new: true }).lean();

    res.json({
      agent: normalizeAgent(updated),
      message: 'Phone number unlinked successfully',
    });
  } catch (err) {
    log.error('unlink_phone_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to unlink phone number' });
  }
});

export default router;