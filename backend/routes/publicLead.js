import express from 'express';
import Lead from '../db/models/Lead.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';

const router = express.Router();

router.post('/', contentFilter('name', 'purpose', 'notes'), async (req, res) => {
  try {
    const { name, phone, email, purpose, notes } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ message: 'Name, phone, and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const phoneRegex = /^[\d\s\-\+()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const lead = await Lead.create({
      agentId: null,
      callId: null,
      userId: '000000000000000000000000',
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      purpose: purpose || 'Inquiry via AI Chat',
      notes: notes || null,
      status: 'new',
      leadType: 'public',
    });

    log.info('public_lead_created', { leadId: String(lead._id), email, name });

    return res.status(201).json({
      message: 'Thank you! Our team will contact you shortly.',
      lead: { id: lead._id, name: lead.name, email: lead.email, phone: lead.phone },
    });
  } catch (error) {
    log.error('public_lead_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to submit. Please try again.' });
  }
});

export default router;
