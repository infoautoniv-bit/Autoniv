import mongoose from 'mongoose';
import express from 'express';
import { log } from '../services/logger.js';
import User from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import { authenticate, requireFeature } from '../middleware/auth.js';
import { containsAbuse } from '../services/contentModeration.js';
import { deleteRecordings } from '../services/cloudinary.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('chat'));

const VALID_TYPES = ['receptionist', 'appointment', 'faq'];

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}

function detectIntent(message) {
  if (/(?:create|add|make|new)\s+(?:a\s+)?agent/i.test(message)) return 'create_agent';
  if (/how\s+(?:to|do|can|would)/i.test(message)) return 'help_topic';
  if (/(?:list|show|get|display|my|all)\s+(?:my\s+)?agents/i.test(message)) return 'list_agents';
  if (/(?:edit|update|change|modify)\s+(?:my\s+)?agent/i.test(message)) return 'edit_agent';
  if (/(?:delete|remove|destroy)\s+(?:my\s+)?agent/i.test(message)) return 'delete_agent';
  if (/(?:help|commands|hi|hello|hey|what can)/i.test(message)) return 'help';
  if (/(?:status|active|inactive|disable|enable|toggle)\s+(?:my\s+)?agent/i.test(message)) return 'toggle_agent';
  return 'unknown';
}

function extractName(text) {
  const patterns = [
    /(?:name\s+(?:is\s+)?['"]?([A-Za-z0-9\s'-]+?)['"]?)(?:\s+(?:and|with|type|prompt))/i,
    /(?:name\s+(?:is\s+)?['"]?([A-Za-z0-9\s'-]+)['"]?)\s*$/i,
    /called\s+['"]?([A-Za-z0-9\s'-]+)['"]?/i,
    /agent\s+['"]?([A-Za-z0-9\s'-]+)['"]?/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[1] || match[0];
  }
  return null;
}

function extractType(text) {
  for (const t of VALID_TYPES) {
    if (new RegExp(t, 'i').test(text)) return t;
  }
  const map = { booking: 'appointment', faq: 'faq', reception: 'receptionist', front: 'receptionist', support: 'faq' };
  for (const [k, v] of Object.entries(map)) {
    if (new RegExp(k, 'i').test(text)) return v;
  }
  return null;
}

function extractPrompt(text) {
  const match = text.match(/(?:prompt|instructions?)\s+(?:is\s+)?['"]?([\s\S]+?)['"]?(?:\s+(?:and|with|type|name|voice|language)|\s*$)/i);
  if (match) return match[1].trim();
  const after = text.split(/prompt\s+(?:is\s+)?/i);
  if (after.length > 1) return after[1].trim().replace(/["']$/, '');
  return null;
}

function extractAgentId(text, agents) {
  for (const a of agents) {
    if (new RegExp(a.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)) return a._id;
  }
  return null;
}

async function handleCreateAgent(text, userId) {
  const name = extractName(text);
  const type = extractType(text);

  const missing = [];
  if (!name) missing.push('name (e.g. "My Support Agent")');
  if (!type) missing.push('type (receptionist, appointment, or faq)');

  if (missing.length > 0) {
    return { text: `I need a few details: ${missing.join(', ')}.\n\nExample: \`create agent name "Front Desk" type receptionist\``, type: 'error' };
  }

  const user = await User.findById(userId).lean();
  if (!user) return { text: 'Your account was not found.', type: 'error' };

  const LIMITS = { free: 1, starter: 3, growth: 10 };
  const maxAgents = LIMITS[user.plan];
  if (maxAgents) {
    const count = await Agent.countDocuments({ userId });
    if (count >= maxAgents) {
      return { text: `Your ${user.plan} plan allows a maximum of ${maxAgents} agent${maxAgents > 1 ? 's' : ''}. Go to **Billing** to upgrade.`, type: 'error' };
    }
  }

  await Agent.create({ userId, name, type, isActive: true });
  return { text: `✅ Agent **${escapeHtml(name)}** created!\n- Type: ${type}\n- Status: Active\n\nYou can edit it from your Agents list to add a voice, prompt, and language.`, type: 'success' };
}

async function handleListAgents(userId) {
  const agentUserId = new mongoose.Types.ObjectId(userId);
  const agents = await Agent.aggregate([
    { $match: { userId: agentUserId } },
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
  ]);

  if (agents.length === 0) {
    return { text: 'You don\'t have any agents yet. Create one with \`create agent name "My Agent" type receptionist\`.', type: 'info' };
  }

  let text = `📋 **Your Agents (${agents.length})**\n\n`;
  for (const a of agents) {
    const status = a.isActive ? '🟢 Active' : '🔴 Inactive';
    text += `• **${escapeHtml(a.name)}** — ${a.type} — ${status} — ${a.callCount || 0} calls\n`;
  }
  return { text, type: 'info' };
}

async function handleEditAgent(text, userId) {
  const agents = await Agent.find({ userId }).lean();
  if (agents.length === 0) return { text: 'You don\'t have any agents to edit.', type: 'error' };

  const name = extractName(text);
  const agentId = extractAgentId(text, agents);

  if (!agentId) {
    const names = agents.map(a => `"${a.name}"`).join(', ');
    return { text: `Which agent? You have: ${names}. Example: \`edit agent "My Agent" name "New Name"\``, type: 'info' };
  }

  const newName = name && !agents.some(a => a.name.toLowerCase() === name.toLowerCase() && a._id.toString() !== agentId.toString()) ? name : null;
  const newType = extractType(text);

  if (!newName && !newType) {
    return { text: 'What would you like to change? Provide a new name or type.\n\nExample: \`edit agent "My Agent" name "New Name"\`', type: 'error' };
  }

  const updates = {};
  if (newName) updates.name = newName;
  if (newType) updates.type = newType;

  await Agent.findByIdAndUpdate(agentId, updates);

  const changed = [];
  if (newName) changed.push(`name → "${newName}"`);
  if (newType) changed.push(`type → ${newType}`);
  return { text: `✅ Agent updated: ${changed.join(', ')}`, type: 'success' };
}

async function handleDeleteAgent(text, userId) {
  const agents = await Agent.find({ userId }).lean();
  if (agents.length === 0) return { text: 'You don\'t have any agents to delete.', type: 'error' };

  const name = extractName(text);
  const agentId = extractAgentId(text, agents);

  if (!agentId) {
    const names = agents.map(a => `"${a.name}"`).join(', ');
    return { text: `Which agent? You have: ${names}. Example: \`delete agent "My Agent"\``, type: 'info' };
  }

  const agent = agents.find(a => a._id.toString() === agentId.toString());
  if (agent) {
    if (agent.phoneNumberId) {
      try {
        const { assignAgentToPhone } = await import('../services/vapi.js');
        await assignAgentToPhone(agent.phoneNumberId, null);
      } catch (e) {
        log.warn('vapi_unlink_phone_during_delete_failed', { error: e.message, userId });
      }
    }
    if (agent.vapiId) {
      try {
        const { deleteVapiAssistant } = await import('../services/vapi.js');
        await deleteVapiAssistant(agent.vapiId);
      } catch (e) {
        log.warn('vapi_delete_agent_failed', { error: e.message, userId });
      }
    }
  }

  const callsToDelete = await Call.find({ agentId }).select('recordingUrl').lean();
  await deleteRecordings(callsToDelete.map(c => c.recordingUrl));

  await Promise.all([
    Lead.deleteMany({ agentId }),
    Appointment.deleteMany({ agentId }),
    Call.deleteMany({ agentId }),
    Agent.findByIdAndDelete(agentId),
  ]);

  const agentName = agents.find(a => a._id.toString() === agentId.toString())?.name || 'Agent';
  return { text: `🗑️ Agent **${escapeHtml(agentName)}** deleted.`, type: 'success' };
}

async function handleToggleAgent(text, userId) {
  const agents = await Agent.find({ userId }).lean();
  if (agents.length === 0) return { text: 'You don\'t have any agents to toggle.', type: 'error' };

  const name = extractName(text);
  const agentId = extractAgentId(text, agents);

  if (!agentId) {
    const names = agents.map(a => `"${a.name}"`).join(', ');
    return { text: `Which agent? You have: ${names}. Example: \`disable agent "My Agent"\``, type: 'info' };
  }

  const agent = agents.find(a => a._id.toString() === agentId.toString());
  const newState = !agent.isActive;
  await Agent.findByIdAndUpdate(agentId, { isActive: newState });

  const action = newState ? 'enabled' : 'disabled';
  return { text: `✅ Agent **${escapeHtml(agent.name)}** is now ${action}.`, type: 'success' };
}

function getHelp() {
  return { text: `🤖 **Agent Assistant**\n\nI can help you manage your voice agents:\n\n**Commands**\n• \`create agent name "My Agent" type receptionist\` — Create a new agent\n• \`list my agents\` — View all your agents\n• \`edit agent "My Agent" name "New Name"\` — Rename or change type\n• \`delete agent "My Agent"\` — Remove an agent\n• \`disable agent "My Agent"\` / \`enable agent "My Agent"\` — Toggle active status\n• \`help\` — Show this message\n\n**Agent types**: \`receptionist\`, \`appointment\`, \`faq\`\n**Plan limits**: Free = 1 agent, Starter = 3 agents, Growth = 10 agents`, type: 'info' };
}

function handleHelpTopic(text) {
  const lower = text.toLowerCase();
  if (/create|make|add|new/i.test(lower)) return { text: 'To create an agent, use: `create agent name "My Agent" type receptionist`', type: 'info' };
  if (/edit|update|change|modify|rename/i.test(lower)) return { text: 'To edit an agent, use: `edit agent "Agent Name" name "New Name"`', type: 'info' };
  if (/delete|remove/i.test(lower)) return { text: 'To delete an agent, use: `delete agent "Agent Name"`', type: 'info' };
  if (/type|receptionist|appointment|faq/i.test(lower)) return { text: 'Agent types: **receptionist** (front desk), **appointment** (booking), **faq** (Q&A).', type: 'info' };
  if (/limit|plan|basic|pro|max|free|starter|growth/i.test(lower)) return { text: '**Free** plan: 1 agent. **Starter** plan: 3 agents. **Growth** plan: 10 agents. **Enterprise**: unlimited. Go to Billing to upgrade.', type: 'info' };
  return getHelp();
}

const handlers = {
  create_agent: handleCreateAgent, list_agents: handleListAgents, edit_agent: handleEditAgent,
  delete_agent: handleDeleteAgent, toggle_agent: handleToggleAgent,
  help: (_, userId) => Promise.resolve(getHelp()), help_topic: handleHelpTopic,
  unknown: async (text) => ({ text: `I'm not sure what you mean. Try \`help\` to see what I can do.\n\nYou said: "${escapeHtml(text.trim().slice(0, 100))}"`, type: 'error' }),
};

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ response: 'Please send a message.', type: 'error' });
    }

    const trimmed = message.trim();
    if (containsAbuse(trimmed)) {
      return res.status(400).json({ response: 'Your message contains inappropriate language and cannot be processed.', type: 'error' });
    }

    const intent = detectIntent(trimmed);
    const handler = handlers[intent];
    const result = await handler(trimmed, req.user.userId);
    res.json({ response: result.text, type: result.type });
  } catch (error) {
    log.error('agent_chat_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ response: 'An error occurred processing your request.', type: 'error' });
  }
});

export default router;
