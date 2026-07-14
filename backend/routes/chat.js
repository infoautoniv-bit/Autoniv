import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import UpgradeRequest from '../db/models/UpgradeRequest.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { log } from '../services/logger.js';
import { containsAbuse } from '../services/contentModeration.js';
import { deleteRecordings } from '../services/cloudinary.js';

const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

const VALID_TYPES = ['receptionist', 'appointment', 'faq'];
const VALID_PLANS = ['free', 'starter', 'growth', 'enterprise'];
const PLAN_LIMITS = { free: 50, starter: 500, growth: 3000, enterprise: 999999 };
const CALLS_LIMITS = { free: 100, starter: 1000, growth: 5000, enterprise: 99999 };

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, c => map[c]);
}

const INTENT_PATTERNS = [
  { name: 'create_user', patterns: [/(?:create|add|make|new)\s+(?:a\s+)?user/i, /(?:create|add|register)\s+(?:a\s+)?(?:new\s+)?account/i] },
  { name: 'create_agent', patterns: [/(?:create|add|make|new)\s+(?:a\s+)?agent/i, /(?:create|add|make|new)\s+(?:a\s+)?(?:voice\s+)?assistant/i] },
  { name: 'list_users', patterns: [/(?:list|show|get|display|all)\s+(?:all\s+)?users/i, /(?:list|show|get|display)\s+(?:all\s+)?(?:user\s+)?accounts/i, /who\s+(?:is|are)\s+(?:registered|signed\s+up)/i] },
  { name: 'list_agents', patterns: [/(?:list|show|get|display|all)\s+(?:all\s+)?agents/i, /(?:list|show|get|display)\s+(?:all\s+)?(?:voice\s+)?assistants/i] },
  { name: 'delete_user', patterns: [/(?:delete|remove|destroy)\s+(?:a\s+)?user/i] },
  { name: 'block_user', patterns: [/(?:block|ban|disable|suspend)\s+(?:a\s+)?user/i] },
  { name: 'unblock_user', patterns: [/(?:unblock|unban|enable|activate)\s+(?:a\s+)?user/i] },
  { name: 'user_info', patterns: [/(?:info|details|find|search|lookup)\s+(?:a\s+)?user/i, /(?:who\s+is|tell\s+me\s+about)\s+/i] },
  { name: 'help', patterns: [/^(?:help|commands|what\s+can\s+(?:you|i)\s+(?:do|say)|hello|hi|hey)/i] },
];

function detectIntent(message) {
  for (const intent of INTENT_PATTERNS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(message)) return intent.name;
    }
  }
  return 'unknown';
}

function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

function extractValue(text, patterns) {
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[1] || match[0];
  }
  return null;
}

function extractName(text) {
  const patterns = [
    /(?:name\s+(?:is\s+)?['"]?([A-Za-z\s'-]+?)['"]?)(?:\s+(?:and|with|email|company|phone|plan|password|type))/i,
    /(?:name\s+(?:is\s+)?['"]?([A-Za-z\s'-]+)['"]?)\s*$/i,
    /called\s+['"]?([A-Za-z\s'-]+)['"]?/i,
    /(?:user|agent)\s+['"]?([A-Za-z\s'-]+)['"]?/i,
  ];
  return extractValue(text, patterns);
}

function extractPassword(text) {
  const patterns = [/(?:password\s+(?:is\s+)?['"]?(\S+)['"]?)/i, /(?:pass\s+['"]?(\S+)['"]?)/i];
  return extractValue(text, patterns);
}

function extractCompany(text) {
  const patterns = [
    /(?:company\s+(?:is\s+)?['"]?([A-Za-z0-9\s'-]+?)['"]?)(?:\s+(?:and|with|email|phone|plan))/i,
    /(?:company\s+(?:is\s+)?['"]?([A-Za-z0-9\s'-]+)['"]?)\s*$/i,
  ];
  return extractValue(text, patterns);
}

function extractType(text) {
  for (const t of VALID_TYPES) {
    if (new RegExp(t, 'i').test(text)) return t;
  }
  const typeMap = { booking: 'appointment', faq: 'faq', reception: 'receptionist', front: 'receptionist', support: 'faq' };
  for (const [key, val] of Object.entries(typeMap)) {
    if (new RegExp(key, 'i').test(text)) return val;
  }
  return null;
}

function extractPlan(text) {
  for (const p of VALID_PLANS) {
    if (new RegExp(p, 'i').test(text)) return p;
  }
  return null;
}

async function handleCreateUser(message) {
  const name = extractName(message);
  const email = extractEmail(message);
  const password = extractPassword(message);
  const company = extractCompany(message);
  const plan = extractPlan(message) || 'free';

  const missing = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!password) missing.push('password');

  if (missing.length > 0) {
    return { text: `I need more information to create a user. Please provide: ${missing.join(', ')}.\n\nExample: \`create user name "John Doe" email john@test.com password mypass company "Acme"\``, type: 'error' };
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return { text: `A user with email **${escapeHtml(email)}** already exists.`, type: 'error' };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await User.create({ email, password: hashedPassword, name, company: company || '', plan });

  return { text: `✅ User **${escapeHtml(name)}** created successfully!\n- Email: ${escapeHtml(email)}\n- Plan: ${plan}\n- Company: ${escapeHtml(company || 'N/A')}\n- Minutes Limit: ${PLAN_LIMITS[plan]}`, type: 'success' };
}

async function handleCreateAgent(message) {
  const name = extractName(message);
  const type = extractType(message);
  const email = extractEmail(message);

  const missing = [];
  if (!name) missing.push('name');
  if (!type) missing.push('type (receptionist, appointment, or faq)');

  if (missing.length > 0) {
    return { text: `I need more information to create an agent. Please provide: ${missing.join(', ')}.\n\nExample: \`create agent name "SupportBot" type faq for user@company.com\``, type: 'error' };
  }

  let userId = null;
  if (email) {
    const user = await User.findOne({ email });
    if (!user) return { text: `No user found with email **${escapeHtml(email)}**.`, type: 'error' };
    userId = user._id;
  } else {
    const user = await User.findOne({ role: 'user' }).sort({ createdAt: 1 }).lean();
    if (!user) return { text: 'No users found. Create a user first.', type: 'error' };
    userId = user._id;
  }

  const agent = await Agent.create({ userId, name, type, isActive: true });
  const userName = (await User.findById(agent.userId).lean())?.name || 'Unknown';

  return { text: `✅ Agent **${escapeHtml(name)}** created successfully!\n- Type: ${type}\n- Owner: ${escapeHtml(userName)}${email ? `\n- User: ${escapeHtml(email)}` : ''}`, type: 'success' };
}

async function handleListUsers() {
  const users = await User.find().sort({ createdAt: -1 }).limit(20).lean();
  if (users.length === 0) return { text: 'No users found in the system.', type: 'info' };

  let text = `📋 **Users (${users.length})**\n\n`;
  for (const u of users) {
    const status = u.isActive ? '🟢 Active' : '🔴 Blocked';
    text += `• **${escapeHtml(u.name)}** — ${escapeHtml(u.email)} — ${u.plan} — ${status}\n`;
  }
  return { text, type: 'info' };
}

async function handleListAgents() {
  const agents = await Agent.find().populate('userId', 'name').sort({ createdAt: -1 }).limit(20).lean();
  if (agents.length === 0) return { text: 'No agents found in the system.', type: 'info' };

  let text = `📋 **Agents (${agents.length})**\n\n`;
  for (const a of agents) {
    const status = a.isActive ? '🟢 Active' : '🔴 Inactive';
    const owner = a.userId?.name ? escapeHtml(a.userId.name) : 'Unknown';
    text += `• **${escapeHtml(a.name)}** — ${a.type} — Owner: ${owner} — ${status}\n`;
  }
  return { text, type: 'info' };
}

async function handleDeleteUser(message) {
  const email = extractEmail(message);
  const name = extractName(message);

  let user = null;
  if (email) user = await User.findOne({ email });
  else if (name) user = await User.findOne({ name: new RegExp(name, 'i') });

  if (!user) return { text: 'User not found. Please provide the email or name of the user to delete.', type: 'error' };
  if (user.email === 'admin@autoniv.ai') return { text: 'Cannot delete the primary admin account.', type: 'error' };

  const callsToDelete = await Call.find({ userId: user._id }).select('recordingUrl').lean();
  await deleteRecordings(callsToDelete.map(c => c.recordingUrl));

  await Promise.all([
    Appointment.deleteMany({ userId: user._id }),
    Lead.deleteMany({ userId: user._id }),
    Call.deleteMany({ userId: user._id }),
  ]);

  const agents = await Agent.find({ userId: user._id }).lean();
  for (const agent of agents) {
    if (agent.phoneNumberId) {
      try {
        const { assignAgentToPhone } = await import('../services/vapi.js');
        await assignAgentToPhone(agent.phoneNumberId, null);
      } catch { }
    }
    if (agent.vapiId) {
      try { const { deleteVapiAssistant } = await import('../services/vapi.js'); await deleteVapiAssistant(agent.vapiId); } catch { }
    }
  }
  await Agent.deleteMany({ userId: user._id });
  await UpgradeRequest.deleteMany({ userId: user._id });
  await User.findByIdAndDelete(user._id);

  return { text: `🗑️ User **${escapeHtml(user.name)}** (${escapeHtml(user.email)}) and all associated data deleted.`, type: 'success' };
}

async function handleBlockUser(message) { return await toggleBlockUser(message, false); }
async function handleUnblockUser(message) { return await toggleBlockUser(message, true); }

async function toggleBlockUser(message, setActive) {
  const email = extractEmail(message);
  const name = extractName(message);
  let user = null;
  if (email) user = await User.findOne({ email });
  else if (name) user = await User.findOne({ name: new RegExp(name, 'i') });

  if (!user) return { text: 'User not found. Please provide the email or name.', type: 'error' };
  if (user.isActive === setActive) {
    return { text: `User **${escapeHtml(user.name)}** is ${setActive ? 'already active' : 'already blocked'}.`, type: 'info' };
  }

  await User.findByIdAndUpdate(user._id, { isActive: setActive });
  const action = setActive ? 'unblocked' : 'blocked';
  return { text: `✅ User **${escapeHtml(user.name)}** has been ${action}.`, type: 'success' };
}

async function handleUserInfo(message) {
  const email = extractEmail(message);
  const name = extractName(message);
  let user = null;
  if (email) user = await User.findOne({ email }).lean();
  else if (name) user = await User.findOne({ name: new RegExp(name, 'i') }).lean();

  if (!user) return { text: 'User not found. Please provide the email or name.', type: 'error' };

  const [agentCount, callCount] = await Promise.all([
    Agent.countDocuments({ userId: user._id }),
    Call.countDocuments({ userId: user._id }),
  ]);

  return { text: `👤 **${escapeHtml(user.name)}**\n- Email: ${escapeHtml(user.email)}\n- Role: ${user.role}\n- Company: ${escapeHtml(user.company || 'N/A')}\n- Plan: ${user.plan}\n- Minutes: ${Math.round(user.minutesUsed || 0)} / ${user.minutesLimit}\n- Status: ${user.isActive ? '🟢 Active' : '🔴 Blocked'}\n- Agents: ${agentCount}\n- Calls: ${callCount}\n- Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`, type: 'info' };
}

function getHelp() {
  return { text: `🤖 **Admin Chat Commands**\n\nHere's what I can do:\n\n**👥 Users**\n• \`create user name "John" email john@test.com password mypass company "Acme"\` — Add a new user\n• \`list users\` — Show all users\n• \`info user email john@test.com\` — Get user details\n• \`block user email john@test.com\` — Block a user\n• \`unblock user email john@test.com\` — Unblock a user\n• \`delete user email john@test.com\` — Remove a user\n\n**🤖 Agents**\n• \`create agent name "Support" type faq for user@test.com\` — Create an agent (assigns to first user if no email given)\n• \`list agents\` — Show all agents\n\n**💡 Tips**\n• You can use email or name to identify users\n• Agent types: \`receptionist\`, \`appointment\`, \`faq\`\n• Plans: \`free\` (100 conv), \`starter\` (1,000 conv), \`growth\` (5,000 conv), \`enterprise\` (unlimited)`, type: 'info' };
}

const intentHandlers = {
  create_user: handleCreateUser, create_agent: handleCreateAgent, list_users: handleListUsers,
  list_agents: handleListAgents, delete_user: handleDeleteUser, block_user: handleBlockUser,
  unblock_user: handleUnblockUser, user_info: handleUserInfo, help: getHelp,
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
    const handler = intentHandlers[intent];
    if (!handler) {
      return res.json({ response: `I'm not sure what you mean. Try \`help\` to see available commands.`, type: 'error' });
    }

    const result = await handler(trimmed);
    res.json({ response: result.text, type: result.type });
  } catch (error) {
    log.error('chat_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ response: 'An error occurred processing your request.', type: 'error' });
  }
});

export default router;
