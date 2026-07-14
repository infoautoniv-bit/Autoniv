import express from 'express';
import Contact from '../db/models/Contact.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';

const router = express.Router();

router.post('/', contentFilter('name', 'message'), async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      message: message.trim(),
    });

    log.info('contact_created', { contactId: String(contact._id), email, name });

    return res.status(201).json({ message: 'Thank you! Our team will reach out within 24 hours.' });
  } catch (error) {
    log.error('contact_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to submit. Please try again.' });
  }
});

export default router;
