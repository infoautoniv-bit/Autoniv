import express from 'express';
import Support from '../db/models/Support.js';
import { contentFilter } from '../services/contentModeration.js';
import { sendSupportNotification } from '../services/emailService.js';
import { sendContactWhatsApp } from '../services/whatsappService.js';
import { log } from '../services/logger.js';

const router = express.Router();

router.post('/', contentFilter('name', 'message'), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const ticket = await Support.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    log.info('support_ticket_created', { ticketId: String(ticket._id), email, name, subject });

    const data = { name: name.trim(), email: email.trim(), phone: null, company: null, message: `[${subject.trim()}] ${message.trim()}` };
    sendSupportNotification({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }).catch(err => log.error('support_email_failed', { error: err.message }));
    sendContactWhatsApp(data).catch(err => log.error('support_whatsapp_failed', { error: err.message }));

    return res.status(201).json({ message: 'Ticket submitted! Our team will get back to you within 24 hours.' });
  } catch (error) {
    log.error('support_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to submit ticket. Please try again.' });
  }
});

export default router;
