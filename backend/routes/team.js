import express from 'express';
import User from '../db/models/User.js';
import { authenticate } from '../middleware/auth.js';
import { isValidEmail } from '../services/validators.js';
import { log } from '../services/logger.js';

const router = express.Router();
router.use(authenticate);

// GET /api/team — fetch user's team seats and team members
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('name email role teamMembers teamLimit chatPlan voicePlan').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const chatPlan = user.chatPlan || 'chat_free';
    const voicePlan = user.voicePlan || 'none';

    let planName = 'Launch Plan';
    let defaultSeats = 2;

    const activeVoice = user.voicePlan || '';
    const activeChat = user.chatPlan || '';

    if (activeVoice.includes('enterprise') || activeChat.includes('enterprise')) {
      planName = 'Enterprise Plan';
      defaultSeats = 999;
    } else if (activeVoice.includes('growth') || activeChat.includes('growth')) {
      planName = 'Scale Plan';
      defaultSeats = 999;
    } else if (activeVoice.includes('starter') || activeChat.includes('starter')) {
      planName = 'Growth Plan';
      defaultSeats = 5;
    } else {
      planName = 'Launch Plan';
      defaultSeats = 2;
    }

    const members = user.teamMembers || [];
    const totalSeats = user.teamLimit || defaultSeats;

    res.json({
      planName,
      owner: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'Owner'
      },
      teamMembers: members,
      usedSeats: members.length + 1, // Owner + Members
      totalSeats: totalSeats
    });
  } catch (error) {
    log.error('fetch_team_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch team details' });
  }
});

// POST /api/team/invite — invite / add team member
router.post('/invite', async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team member name is required' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email address is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeVoice = user.voicePlan || '';
    const activeChat = user.chatPlan || '';
    let defaultSeats = 2;
    if (activeVoice.includes('enterprise') || activeChat.includes('enterprise') || activeVoice.includes('growth') || activeChat.includes('growth')) {
      defaultSeats = 999;
    } else if (activeVoice.includes('starter') || activeChat.includes('starter')) {
      defaultSeats = 5;
    }
    const teamLimit = user.teamLimit || defaultSeats;
    const currentCount = (user.teamMembers || []).length + 1; // Owner + members

    if (currentCount >= teamLimit) {
      return res.status(400).json({ message: `Seat limit reached (${teamLimit} seats maximum). Please upgrade your plan for more seats.` });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === user.email.toLowerCase()) {
      return res.status(400).json({ message: 'You are already the owner of this workspace' });
    }

    const exists = (user.teamMembers || []).some(m => m.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({ message: 'Team member with this email already exists' });
    }

    user.teamMembers = user.teamMembers || [];
    const newMember = {
      name: name.trim(),
      email: cleanEmail,
      role: ['admin', 'member', 'agent'].includes(role) ? role : 'member',
      status: 'active',
      addedAt: new Date()
    };

    user.teamMembers.push(newMember);
    await user.save();

    log.info('team_member_added', { userId: user._id, email: cleanEmail });

    res.status(201).json({
      message: 'Team member added successfully',
      teamMembers: user.teamMembers,
      usedSeats: user.teamMembers.length + 1,
      totalSeats: teamLimit
    });
  } catch (error) {
    log.error('invite_team_member_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to add team member' });
  }
});

// DELETE /api/team/:memberId — remove team member
router.delete('/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.teamMembers = (user.teamMembers || []).filter(m => m._id.toString() !== memberId);
    await user.save();

    log.info('team_member_removed', { userId: user._id, memberId });

    res.json({
      message: 'Team member removed',
      teamMembers: user.teamMembers,
      usedSeats: user.teamMembers.length + 1,
      totalSeats: user.teamLimit || 5
    });
  } catch (error) {
    log.error('remove_team_member_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to remove team member' });
  }
});

export default router;
