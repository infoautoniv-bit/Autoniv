import express from 'express';
import Appointment from '../db/models/Appointment.js';
import { authenticate, requireAdmin, requireFeature } from '../middleware/auth.js';
import { requireValidObjectId } from '../middleware/validators.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import { sendAppointmentConfirmation } from '../services/whatsappService.js';
import { sendAppointmentEmail } from '../services/emailService.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';

const router = express.Router();
router.use(authenticate);

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const filter = {};
    const [appointments, total] = await Promise.all([
      Appointment.find(filter).sort({ createdAt: -1 }).populate('agentId', 'name').populate('userId', 'name').skip(skip).limit(limit).lean(),
      Appointment.countDocuments(filter),
    ]);

    const result = appointments.map(a => ({
      ...a,
      id: a._id,
      agentName: a.agentId?.name || null,
      userName: a.userId?.name || null,
      agentId: a.agentId?._id || a.agentId,
      userId: a.userId?._id || a.userId,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_all_appointments_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const user = req.user;
    const filter = { userId: user.userId };

    // Filter by plan: chat-only shows chat appointments (callId null), voice-only shows voice appointments (callId present)
    if (user.chatPlan && user.chatPlan !== 'none' && (!user.voicePlan || user.voicePlan === 'none')) {
      filter.callId = null;
    } else if (user.voicePlan && user.voicePlan !== 'none' && (!user.chatPlan || user.chatPlan === 'none')) {
      filter.callId = { $ne: null };
    }
    // both plans: no callId filter (shows all)
    const [appointments, total] = await Promise.all([
      Appointment.find(filter).sort({ createdAt: -1 }).populate('agentId', 'name').skip(skip).limit(limit).lean(),
      Appointment.countDocuments(filter),
    ]);

    const result = appointments.map(a => ({
      ...a,
      id: a._id,
      agentName: a.agentId?.name || null,
      agentId: a.agentId?._id || a.agentId,
    }));

    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_my_appointments_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

router.post('/:id/notify-whatsapp', requireValidObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).lean();
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ message: 'Appointment is not confirmed' });
    }
    const result = await sendAppointmentConfirmation(appointment);
    res.json({ notification: result });
  } catch (error) {
    log.error('notify_whatsapp_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to send WhatsApp notification' });
  }
});

router.put('/:id', requireValidObjectId('id'), contentFilter('name', 'service'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, service, preferredDate, preferredTime, status } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (service !== undefined) updates.service = service;
    if (preferredDate !== undefined) updates.preferredDate = preferredDate;
    if (preferredTime !== undefined) updates.preferredTime = preferredTime;
    if (status !== undefined) updates.status = status;

    const updated = await Appointment.findByIdAndUpdate(id, updates, { new: true })
      .populate('agentId', 'name')
      .lean();

    if (status === 'confirmed') {
      if (updated.email) {
        try {
          await sendAppointmentEmail({ to: updated.email, appointment: updated });
        } catch (emailErr) {
          log.error('appointment_email_failed', { error: emailErr.message, appointmentId: id });
        }
      }
      try {
        await sendAppointmentConfirmation(updated);
      } catch (waErr) {
        log.error('appointment_whatsapp_failed', { error: waErr.message, appointmentId: id });
      }
    }

    res.json({
      appointment: {
        ...updated,
        id: updated._id,
        agentName: updated.agentId?.name || null,
        agentId: updated.agentId?._id || updated.agentId,
      },
    });
  } catch (error) {
    log.error('update_appointment_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

export default router;
