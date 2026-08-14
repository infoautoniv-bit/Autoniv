import mongoose from 'mongoose';
import express from 'express';
import { z } from 'zod';
import Agent from '../../db/models/Agent.js';
import User from '../../db/models/User.js';
import Call from '../../db/models/Call.js';
import Lead from '../../db/models/Lead.js';
import Appointment from '../../db/models/Appointment.js';
import PhoneNumber from '../../db/models/PhoneNumber.js';
import { authenticate, requireAdmin, requireFeature } from '../../middleware/auth.js';
import { contentFilter } from '../../services/contentModeration.js';
import { log, IS_PROD } from '../../services/logger.js';
import { parsePage, paginatedResponse } from '../../services/pagination.js';
import { deleteRecordings } from '../../services/cloudinary.js';
import {
  createVapiAssistant,
  updateVapiAssistant,
  deleteVapiAssistant,
  assignAgentToPhone,
  createVapiPhoneNumber,
  listVapiPhoneNumbers,
} from '../../services/vapi.js';
import { encrypt, decrypt } from '../../services/encryption.js';
import { configureTwilioIncomingWebhook } from '../../services/twilioService.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('voice'));

const VALID_TYPES = ['receptionist', 'appointment', 'faq'];

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim(),
  type: z.enum(['receptionist', 'appointment', 'faq'], { errorMap: () => ({ message: `type must be one of: ${VALID_TYPES.join(', ')}` }) }),
  prompt: z.string().max(10000, 'Prompt too long').optional().nullable(),
  language: z.string().max(50).optional().nullable(),
  voiceId: z.string().max(100).optional().nullable(),
  useCustomEngine: z.boolean().optional(),
  customEngineModel: z.string().max(100).optional().nullable(),
  phoneNumberId: z.string().max(100).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  twilioAccountSid: z.string().max(100).optional().nullable(),
  twilioAuthToken: z.string().max(100).optional().nullable(),
  hubspotToken: z.string().optional().nullable(),
  webhookUrl: z.string().optional().nullable(),
  webhookSecret: z.string().optional().nullable(),
  googleSheetId: z.string().optional().nullable(),
  googleSheetUrl: z.string().optional().nullable(),
  fieldMapping: z.unknown().optional().nullable(),
  customHeaders: z.unknown().optional().nullable(),
  payloadTemplate: z.string().optional().nullable(),
  crmIntegrations: z.record(z.unknown()).optional(),
  maxConcurrentCalls: z.number().min(0).max(100).optional(),
}).passthrough();

function sanitizeCrmIntegrations(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const sanitized = {};
  const SAFE_KEYS = [
    'enabled', 'provider', 'apiKey', 'webhookUrl', 'webhookSecret',
    'syncLeads', 'syncCalls', 'fieldMapping', 'customHeaders',
    'hubspotToken', 'payloadTemplate', 'googleSheetId', 'googleSheetUrl'
  ];
  for (const key of Object.keys(obj)) {
    if (SAFE_KEYS.includes(key)) {
      const val = obj[key];
      if (typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number' || val === null) {
        sanitized[key] = val;
      } else if (typeof val === 'object' && !Array.isArray(val)) {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}

function normalizeAgent(agent) {
  if (!agent) return null;
  const obj = agent.toObject ? agent.toObject() : { ...agent };
  obj.id = obj._id ? obj._id.toString() : obj.id;
  if (obj.userId) obj.userId = obj.userId.toString();
  obj.hasTwilioCredentials = !!(obj.twilioAccountSid && obj.twilioAuthToken);
  delete obj.twilioAccountSid;
  delete obj.twilioAuthToken;
  return obj;
}

async function resolveAgentForUser(id, user) {
  if (!mongoose.Types.ObjectId.isValid(id)) return { agent: null, forbidden: false };
  const agent = await Agent.findById(id).lean();
  if (!agent) return { agent: null, forbidden: false };
  const userIdStr = (user.userId || user._id || user.id || '').toString();
  const agentUserIdStr = (agent.userId || '').toString();
  if (user.role === 'admin' || agentUserIdStr === userIdStr) {
    return { agent, forbidden: false };
  }
  return { agent, forbidden: true };
}

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
        $addFields: {
          userName: '$user.name',
          userEmail: '$user.email',
        },
      },
      { $project: { user: 0 } },
      { $sort: { createdAt: -1 } },
    ];

    const countPipeline = [{ $count: 'total' }];

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

router.get('/phone-numbers', async (req, res) => {
  try {
    const phoneNumbers = await listVapiPhoneNumbers();
    res.json({ phoneNumbers });
  } catch (err) {
    log.error('list_phone_numbers_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: `Failed to list phone numbers: ${err.message}` });
  }
});

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

router.post('/', contentFilter('name', 'prompt'), async (req, res) => {
  try {
    const parsed = createAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ message: errors.join('; ') });
    }

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
      maxConcurrentCalls,
    } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID in token' });
    }

    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    const PLAN_CONFIG = User.PLAN_CONFIG;
    const planKey = user.plan || (user.voicePlan && user.voicePlan !== 'none' ? user.voicePlan : null) || user.chatPlan || 'chat_free';
    const planCfg = PLAN_CONFIG[planKey];
    if (planCfg) {
      const maxChatbots = planCfg.limits.chatbots;
      if (maxChatbots !== -1) {
        const count = await Agent.countDocuments({ userId: user._id });
        if (count >= maxChatbots) {
          return res.status(403).json({
            message: `Your plan allows a maximum of ${maxChatbots} voice agent${maxChatbots > 1 ? 's' : ''}. Please upgrade to add more.`,
            code: 'CHATBOT_LIMIT_EXCEEDED',
            used: count,
            limit: maxChatbots,
          });
        }
      }
    }

    const isDirectNumber = phoneNumberId ? (phoneNumberId.startsWith('+') || /^\d+$/.test(phoneNumberId)) : false;

    const incomingCrm = req.body.crmIntegrations
      ? sanitizeCrmIntegrations(req.body.crmIntegrations)
      : sanitizeCrmIntegrations({
          hubspotToken: req.body.hubspotToken,
          webhookUrl: req.body.webhookUrl,
          webhookSecret: req.body.webhookSecret,
          googleSheetId: req.body.googleSheetId,
          googleSheetUrl: req.body.googleSheetUrl,
          fieldMapping: req.body.fieldMapping,
          customHeaders: req.body.customHeaders,
          payloadTemplate: req.body.payloadTemplate,
        });

    const agent = await Agent.create({
      userId: user._id,
      vapiId: null,
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
      crmIntegrations: incomingCrm,
      webhookUrl: req.body.webhookUrl || incomingCrm?.webhookUrl || null,
      googleSheetId: req.body.googleSheetId || incomingCrm?.googleSheetId || null,
      googleSheetUrl: req.body.googleSheetUrl || incomingCrm?.googleSheetUrl || null,
      maxConcurrentCalls: maxConcurrentCalls || 1,
    });

    if (agent.phoneNumber || agent.phoneNumberId) {
      const rawNum = (agent.phoneNumber || '').replace(/[\s\-()]/g, '');
      const numOrNull = rawNum ? (rawNum.startsWith('+') ? rawNum : `+${rawNum}`) : null;
      const numWithoutPlus = rawNum ? rawNum.replace(/^\+/, '') : null;

      const filterConditions = [];
      if (agent.phoneNumber) filterConditions.push({ phoneNumber: agent.phoneNumber });
      if (numOrNull) filterConditions.push({ phoneNumber: numOrNull });
      if (numWithoutPlus) filterConditions.push({ phoneNumber: numWithoutPlus });
      if (agent.phoneNumberId && mongoose.Types.ObjectId.isValid(agent.phoneNumberId)) {
        filterConditions.push({ _id: agent.phoneNumberId });
      }

      if (filterConditions.length > 0) {
        PhoneNumber.findOneAndUpdate(
          { userId: user._id, $or: filterConditions },
          { assignedToAgent: agent._id }
        ).catch(() => {});
      }
    }

    res.status(201).json({
      agent: normalizeAgent(agent),
    });

    if (!useCustomEngine) {
      (async () => {
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
          if (vapiAssistant?.id) {
            await Agent.findByIdAndUpdate(agent._id, { vapiId: vapiAssistant.id });
            if (phoneNumberId && !isDirectNumber) {
              await assignAgentToPhone(phoneNumberId, vapiAssistant.id).catch(() => {});
            }
          }
        } catch (vapiErr) {
          log.warn('background_vapi_create_agent_failed', { error: vapiErr.message, agentId: agent._id });
        }
      })();
    }
  } catch (err) {
    log.error('create_agent_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create agent' });
  }
});

router.put('/:id', contentFilter('name', 'prompt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, prompt, isActive, language, voiceId, useCustomEngine, customEngineModel, twilioAccountSid, twilioAuthToken, maxConcurrentCalls } = req.body;

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
    if (maxConcurrentCalls !== undefined) updates.maxConcurrentCalls = maxConcurrentCalls;
    if (req.body.phoneNumber !== undefined) updates.phoneNumber = req.body.phoneNumber;
    if (req.body.phoneNumberId !== undefined) updates.phoneNumberId = req.body.phoneNumberId;
    if (
      req.body.crmIntegrations !== undefined ||
      req.body.hubspotToken !== undefined ||
      req.body.webhookUrl !== undefined ||
      req.body.webhookSecret !== undefined ||
      req.body.googleSheetId !== undefined ||
      req.body.googleSheetUrl !== undefined ||
      req.body.fieldMapping !== undefined ||
      req.body.customHeaders !== undefined ||
      req.body.payloadTemplate !== undefined
    ) {
      const incomingCrm = req.body.crmIntegrations
        ? sanitizeCrmIntegrations(req.body.crmIntegrations)
        : sanitizeCrmIntegrations({
            hubspotToken: req.body.hubspotToken,
            webhookUrl: req.body.webhookUrl,
            webhookSecret: req.body.webhookSecret,
            googleSheetId: req.body.googleSheetId,
            googleSheetUrl: req.body.googleSheetUrl,
            fieldMapping: req.body.fieldMapping,
            customHeaders: req.body.customHeaders,
            payloadTemplate: req.body.payloadTemplate,
          });

      updates.crmIntegrations = {
        ...(agent.crmIntegrations || {}),
        ...incomingCrm,
      };
      if (req.body.webhookUrl !== undefined) {
        updates.webhookUrl = req.body.webhookUrl;
      }
      if (req.body.googleSheetId !== undefined) {
        updates.googleSheetId = req.body.googleSheetId;
      }
      if (req.body.googleSheetUrl !== undefined) {
        updates.googleSheetUrl = req.body.googleSheetUrl;
      }
    }

    const updated = await Agent.findByIdAndUpdate(id, updates, { new: true }).lean();

    if (updated.phoneNumber || updated.phoneNumberId) {
      const rawNum = (updated.phoneNumber || '').replace(/[\s\-()]/g, '');
      const numOrNull = rawNum ? (rawNum.startsWith('+') ? rawNum : `+${rawNum}`) : null;
      const numWithoutPlus = rawNum ? rawNum.replace(/^\+/, '') : null;

      const filterConditions = [];
      if (updated.phoneNumber) filterConditions.push({ phoneNumber: updated.phoneNumber });
      if (numOrNull) filterConditions.push({ phoneNumber: numOrNull });
      if (numWithoutPlus) filterConditions.push({ phoneNumber: numWithoutPlus });
      if (updated.phoneNumberId && mongoose.Types.ObjectId.isValid(updated.phoneNumberId)) {
        filterConditions.push({ _id: updated.phoneNumberId });
      }

      if (filterConditions.length > 0) {
        await PhoneNumber.findOneAndUpdate(
          { userId: agent.userId, $or: filterConditions },
          { assignedToAgent: agent._id }
        );
      }
    }

    res.json({
      agent: normalizeAgent(updated),
    });
  } catch (err) {
    log.error('update_agent_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to update agent' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { agent, forbidden } = await resolveAgentForUser(id, req.user);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    if (forbidden) return res.status(403).json({ message: 'Access denied' });

    const objId = new mongoose.Types.ObjectId(id);

    await Agent.findByIdAndDelete(objId);

    if (agent.phoneNumberId || agent.phoneNumber) {
      PhoneNumber.updateMany(
        { assignedToAgent: agent._id },
        { assignedToAgent: null }
      ).catch(() => {});
    }

    res.json({ message: 'Agent deleted successfully' });

    (async () => {
      if (agent.phoneNumberId) {
        try {
          await assignAgentToPhone(agent.phoneNumberId, null);
        } catch (e) {
          log.warn('vapi_unlink_phone_during_delete_failed', { error: e.message, userId: req.user?.userId });
        }
      }
      if (agent.vapiId) {
        try {
          await deleteVapiAssistant(agent.vapiId);
        } catch (e) {
          log.warn('vapi_delete_agent_failed', { error: e.message, userId: req.user?.userId });
        }
      }
    })();
  } catch (err) {
    log.error('delete_agent_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to delete agent' });
  }
});

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
    
    if (req.user.role !== 'admin' && agent.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const isDirectNumber = phoneNumberId.startsWith('+') || /^\d+$/.test(phoneNumberId);

    if (isDirectNumber) {
      const numberValue = phoneNumberId;

      if (twilioAccountSid && twilioAuthToken) {
        try {
          let webhookUrl;
          if (process.env.WEBHOOK_URL) {
            webhookUrl = process.env.WEBHOOK_URL.replace(/\/vapi$/, '/incoming-call');
          } else {
            const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
            const xfProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
            const isSecure = xfProto === 'https' || req.secure || IS_PROD;
            const protocol = isSecure ? 'https' : 'http';
            webhookUrl = `${protocol}://${host}/api/webhooks/incoming-call`;
          }

          log.info('twilio_auto_configure_webhook_start', { phoneNumber: numberValue, webhookUrl });
          await configureTwilioIncomingWebhook(twilioAccountSid, twilioAuthToken, numberValue, webhookUrl);
          log.info('twilio_auto_configure_webhook_success', { phoneNumber: numberValue });
        } catch (twilioErr) {
          log.error('twilio_auto_configure_webhook_failed', { error: twilioErr.message, phoneNumber: numberValue });
          return res.status(400).json({ message: `Failed to configure Twilio webhook automatically: ${twilioErr.message}` });
        }
      }

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
      const updateFields = { phoneNumberId };
      if (phoneNumber) updateFields.phoneNumber = phoneNumber;
      const updated = await Agent.findByIdAndUpdate(id, updateFields, { new: true }).lean();

      return res.json({
        agent: normalizeAgent(updated),
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

    if (updated.phoneNumber || updated.phoneNumberId) {
      const rawNum = (updated.phoneNumber || '').replace(/[\s\-()]/g, '');
      const numOrNull = rawNum ? (rawNum.startsWith('+') ? rawNum : `+${rawNum}`) : null;
      const numWithoutPlus = rawNum ? rawNum.replace(/^\+/, '') : null;

      const filterConditions = [];
      if (updated.phoneNumber) filterConditions.push({ phoneNumber: updated.phoneNumber });
      if (numOrNull) filterConditions.push({ phoneNumber: numOrNull });
      if (numWithoutPlus) filterConditions.push({ phoneNumber: numWithoutPlus });
      if (updated.phoneNumberId && mongoose.Types.ObjectId.isValid(updated.phoneNumberId)) {
        filterConditions.push({ _id: updated.phoneNumberId });
      }

      if (filterConditions.length > 0) {
        await PhoneNumber.findOneAndUpdate(
          { userId: agent.userId, $or: filterConditions },
          { assignedToAgent: agent._id }
        );
      }
    }

    res.json({
      agent: normalizeAgent(updated),
    });
  } catch (err) {
    log.error('assign_phone_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to assign phone number' });
  }
});

router.post('/:id/unlink-phone', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid agent ID' });
    }

    const agent = await Agent.findById(id).lean();
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    if (req.user.role !== 'admin' && agent.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!agent.phoneNumberId && !agent.phoneNumber) {
      return res.status(400).json({ message: 'Agent has no phone number linked' });
    }

    const phoneNumberId = agent.phoneNumberId;

    if (phoneNumberId) {
      try {
        await assignAgentToPhone(phoneNumberId, null);
      } catch (vapiErr) {
        log.warn('vapi_unlink_phone_failed', { error: vapiErr.message, userId: req.user?.userId });
      }
    }

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
