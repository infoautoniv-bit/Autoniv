import express from 'express';
import PhoneNumber from '../db/models/PhoneNumber.js';
import Agent from '../db/models/Agent.js';
import User from '../db/models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireValidObjectId } from '../middleware/validators.js';
import { log } from '../services/logger.js';
import { parsePage } from '../services/pagination.js';

const router = express.Router();
router.use(authenticate);

// GET /api/phone-numbers - List phone numbers
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { userId: req.user.userId };

    const phoneNumbers = await PhoneNumber.find(filter)
      .populate('assignedToAgent', 'name type isActive')
      .populate('assignedToUser', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      phoneNumbers: phoneNumbers.map((num) => ({
        id: num._id.toString(),
        userId: num.userId?.toString(),
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName || '',
        platform: num.platform,
        credentials: num.credentials || {},
        assignedToAgent: num.assignedToAgent
          ? {
              id: num.assignedToAgent._id?.toString(),
              name: num.assignedToAgent.name,
              type: num.assignedToAgent.type,
            }
          : null,
        assignedToUser: num.assignedToUser
          ? {
              id: num.assignedToUser._id?.toString(),
              name: num.assignedToUser.name,
              email: num.assignedToUser.email,
            }
          : null,
        status: num.status || 'active',
        capabilities: num.capabilities || ['voice'],
        createdAt: num.createdAt,
        updatedAt: num.updatedAt,
      })),
    });
  } catch (err) {
    log.error('list_phone_numbers_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to list phone numbers' });
  }
});

// GET /api/phone-numbers/users-list - Available users for assignment
router.get('/users-list', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { _id: req.user.userId };

    const users = await User.find(filter, 'name email role').sort({ name: 1 }).lean();
    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (err) {
    log.error('list_assignable_users_error', { error: err.message });
    res.status(500).json({ message: 'Failed to fetch users list' });
  }
});

// GET /api/phone-numbers/agents-list - Available agents for assignment
router.get('/agents-list', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { userId: req.user.userId };

    const agents = await Agent.find(filter, 'name type phoneNumber phoneNumberId').sort({ name: 1 }).lean();
    res.json({
      agents: agents.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        type: a.type,
        phoneNumber: a.phoneNumber || null,
        phoneNumberId: a.phoneNumberId || null,
      })),
    });
  } catch (err) {
    log.error('list_assignable_agents_error', { error: err.message });
    res.status(500).json({ message: 'Failed to fetch agents list' });
  }
});

// POST /api/phone-numbers - Add new phone number
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, friendlyName, platform, credentials, assignedToAgent, assignedToUser, capabilities } = req.body;

    if (!phoneNumber || !platform) {
      return res.status(400).json({ message: 'Phone number and platform are required' });
    }

    const validPlatforms = [
      'twilio', 'exotel', 'plivo', 'ozonetel', 'mcube', 'tatatele',
      'maqsam', 'vobiz', 'voicelink', 'vapi', 'retell', 'telnyx', 'signalwire', 'custom'
    ];

    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform specified' });
    }

    const cleanNumber = phoneNumber.trim();

    const existing = await PhoneNumber.findOne({
      userId: req.user.userId,
      phoneNumber: cleanNumber,
    });

    if (existing) {
      return res.status(400).json({ message: 'This phone number is already registered under your account' });
    }

    const newNumber = new PhoneNumber({
      userId: req.user.userId,
      phoneNumber: cleanNumber,
      friendlyName: friendlyName ? friendlyName.trim() : null,
      platform,
      credentials: credentials || {},
      assignedToAgent: assignedToAgent || null,
      assignedToUser: assignedToUser || null,
      capabilities: Array.isArray(capabilities) && capabilities.length > 0 ? capabilities : ['voice'],
      status: 'active',
    });

    await newNumber.save();

    // Sync with Agent if assigned
    if (assignedToAgent) {
      await Agent.findByIdAndUpdate(assignedToAgent, {
        phoneNumberId: newNumber._id.toString(),
        phoneNumber: cleanNumber,
      });
    }

    const populated = await PhoneNumber.findById(newNumber._id)
      .populate('assignedToAgent', 'name type')
      .populate('assignedToUser', 'name email role')
      .lean();

    res.status(201).json({
      phoneNumber: {
        id: populated._id.toString(),
        userId: populated.userId?.toString(),
        phoneNumber: populated.phoneNumber,
        friendlyName: populated.friendlyName || '',
        platform: populated.platform,
        credentials: populated.credentials || {},
        assignedToAgent: populated.assignedToAgent
          ? { id: populated.assignedToAgent._id?.toString(), name: populated.assignedToAgent.name, type: populated.assignedToAgent.type }
          : null,
        assignedToUser: populated.assignedToUser
          ? { id: populated.assignedToUser._id?.toString(), name: populated.assignedToUser.name, email: populated.assignedToUser.email }
          : null,
        status: populated.status,
        capabilities: populated.capabilities,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
    });
  } catch (err) {
    log.error('create_phone_number_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to create phone number: ' + err.message });
  }
});

// PUT /api/phone-numbers/:id - Update phone number details
router.put('/:id', requireValidObjectId('id'), async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const numberDoc = await PhoneNumber.findById(req.params.id);

    if (!numberDoc) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    if (!isAdmin && numberDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { friendlyName, platform, credentials, capabilities, status } = req.body;

    if (friendlyName !== undefined) numberDoc.friendlyName = friendlyName.trim();
    if (platform) numberDoc.platform = platform;
    if (credentials) numberDoc.credentials = { ...numberDoc.credentials, ...credentials };
    if (capabilities) numberDoc.capabilities = capabilities;
    if (status) numberDoc.status = status;

    await numberDoc.save();

    const populated = await PhoneNumber.findById(numberDoc._id)
      .populate('assignedToAgent', 'name type')
      .populate('assignedToUser', 'name email role')
      .lean();

    res.json({
      phoneNumber: {
        id: populated._id.toString(),
        userId: populated.userId?.toString(),
        phoneNumber: populated.phoneNumber,
        friendlyName: populated.friendlyName || '',
        platform: populated.platform,
        credentials: populated.credentials || {},
        assignedToAgent: populated.assignedToAgent
          ? { id: populated.assignedToAgent._id?.toString(), name: populated.assignedToAgent.name, type: populated.assignedToAgent.type }
          : null,
        assignedToUser: populated.assignedToUser
          ? { id: populated.assignedToUser._id?.toString(), name: populated.assignedToUser.name, email: populated.assignedToUser.email }
          : null,
        status: populated.status,
        capabilities: populated.capabilities,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
    });
  } catch (err) {
    log.error('update_phone_number_error', { error: err.message, id: req.params.id });
    res.status(500).json({ message: 'Failed to update phone number' });
  }
});

// PUT /api/phone-numbers/:id/assign - Assign to agent or user
router.put('/:id/assign', requireValidObjectId('id'), async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const numberDoc = await PhoneNumber.findById(req.params.id);

    if (!numberDoc) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    if (!isAdmin && numberDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { assignedToAgent, assignedToUser } = req.body;

    const previousAgentId = numberDoc.assignedToAgent?.toString();

    // If assignedToAgent changed, update old agent to remove number
    if (previousAgentId && previousAgentId !== assignedToAgent) {
      await Agent.findByIdAndUpdate(previousAgentId, {
        $unset: { phoneNumberId: '', phoneNumber: '' },
      });
    }

    numberDoc.assignedToAgent = assignedToAgent || null;
    numberDoc.assignedToUser = assignedToUser || null;
    await numberDoc.save();

    // If new assignedToAgent is set, update that agent
    if (assignedToAgent) {
      await Agent.findByIdAndUpdate(assignedToAgent, {
        phoneNumberId: numberDoc._id.toString(),
        phoneNumber: numberDoc.phoneNumber,
      });
    }

    const populated = await PhoneNumber.findById(numberDoc._id)
      .populate('assignedToAgent', 'name type')
      .populate('assignedToUser', 'name email role')
      .lean();

    res.json({
      phoneNumber: {
        id: populated._id.toString(),
        userId: populated.userId?.toString(),
        phoneNumber: populated.phoneNumber,
        friendlyName: populated.friendlyName || '',
        platform: populated.platform,
        credentials: populated.credentials || {},
        assignedToAgent: populated.assignedToAgent
          ? { id: populated.assignedToAgent._id?.toString(), name: populated.assignedToAgent.name, type: populated.assignedToAgent.type }
          : null,
        assignedToUser: populated.assignedToUser
          ? { id: populated.assignedToUser._id?.toString(), name: populated.assignedToUser.name, email: populated.assignedToUser.email }
          : null,
        status: populated.status,
        capabilities: populated.capabilities,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
    });
  } catch (err) {
    log.error('assign_phone_number_error', { error: err.message, id: req.params.id });
    res.status(500).json({ message: 'Failed to assign phone number' });
  }
});

// DELETE /api/phone-numbers/:id - Delete phone number
router.delete('/:id', requireValidObjectId('id'), async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const numberDoc = await PhoneNumber.findById(req.params.id);

    if (!numberDoc) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    if (!isAdmin && numberDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (numberDoc.assignedToAgent) {
      await Agent.findByIdAndUpdate(numberDoc.assignedToAgent, {
        $unset: { phoneNumberId: '', phoneNumber: '' },
      });
    }

    await PhoneNumber.findByIdAndDelete(req.params.id);
    res.json({ message: 'Phone number deleted successfully' });
  } catch (err) {
    log.error('delete_phone_number_error', { error: err.message, id: req.params.id });
    res.status(500).json({ message: 'Failed to delete phone number' });
  }
});

export default router;
