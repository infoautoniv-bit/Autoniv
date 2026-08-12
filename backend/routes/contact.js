import express from 'express';
import Contact from '../db/models/Contact.js';
import { contentFilter } from '../services/contentModeration.js';
import { sendContactNotification, sendCustomerLeadConfirmationEmail } from '../services/emailService.js';
import { sendContactWhatsApp } from '../services/whatsappService.js';
import { log } from '../services/logger.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';
import { requireValidObjectId } from '../middleware/validators.js';

import { leadFormLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/', leadFormLimiter, contentFilter('name', 'message'), async (req, res) => {
  try {
    const { name, email, phone, company, message, utmSource, utmMedium, utmCampaign, utmContent, utmTerm } = req.body;

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
      utmSource: utmSource?.trim() || null,
      utmMedium: utmMedium?.trim() || null,
      utmCampaign: utmCampaign?.trim() || null,
      utmContent: utmContent?.trim() || null,
      utmTerm: utmTerm?.trim() || null,
    });

    log.info('contact_created', { contactId: String(contact._id), email, name });

    const data = { name: name.trim(), email: email.trim(), phone, company, message: message.trim(), utmSource, utmMedium, utmCampaign };
    sendContactNotification(data).catch(err => log.error('contact_email_failed', { error: err.message }));
    sendContactWhatsApp(data).catch(err => log.error('contact_whatsapp_failed', { error: err.message }));
    sendCustomerLeadConfirmationEmail({ to: email.trim(), name: name.trim() }).catch(err => log.error('customer_confirmation_email_failed', { error: err.message }));

    return res.status(201).json({ message: 'Thank you! Our team will reach out within 24 hours.', contactId: contact._id });
  } catch (error) {
    log.error('contact_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to submit. Please try again.' });
  }
});

// ─── ADMIN ROUTES (view & manage submissions) ────────────────────────────────
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(filter),
    ]);

    const items = contacts.map(c => ({
      ...c,
      id: c._id,
      purpose: c.company || c.message?.slice(0, 40),
    }));

    return res.json(paginatedResponse({ items, total, page, limit }));
  } catch (error) {
    log.error('get_contacts_error', { error: error.message, userId: req.user?.userId });
    return res.status(500).json({ message: 'Failed to fetch contact submissions' });
  }
});

router.put('/:id', authenticate, requireAdmin, requireValidObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!contact) return res.status(404).json({ message: 'Submission not found' });

    return res.json({ message: 'Status updated successfully', contact: { ...contact, id: contact._id } });
  } catch (error) {
    log.error('update_contact_error', { error: error.message, userId: req.user?.userId });
    return res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;

