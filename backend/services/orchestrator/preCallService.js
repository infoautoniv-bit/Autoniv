import { log } from '../logger.js';
import Lead from '../../db/models/Lead.js';
import Contact from '../../db/models/Contact.js';
import Appointment from '../../db/models/Appointment.js';

/**
 * Fetches pre-call context for a caller from local DB or external webhook.
 * Guarantees a fast response (with timeout) so the live call greeting isn't delayed.
 *
 * @param {string} callerNumber - E.164 phone number
 * @param {object} agent - Mongoose Agent doc or plain object
 * @param {number} timeoutMs - Max wait time in ms
 * @returns {Promise<object>} callerContext
 */
export async function fetchPreCallContext(callerNumber, agent = null, timeoutMs = 1500) {
  const context = {
    callerPhone: callerNumber || '',
    callerName: '',
    callerEmail: '',
    pastAppointmentsCount: 0,
    lastAppointment: null,
    isReturningCustomer: false,
    customData: {},
  };

  if (!callerNumber) return context;

  const fetchPromise = (async () => {
    try {
      const normalizedPhone = callerNumber.replace(/[^0-9+]/g, '');

      // 1. Search local Leads / Contacts
      const [lead, contact, pastAppts] = await Promise.allSettled([
        Lead.findOne({ phone: normalizedPhone, ...(agent?.userId ? { userId: agent.userId } : {}) }).sort({ createdAt: -1 }),
        Contact.findOne({ phone: normalizedPhone, ...(agent?.userId ? { userId: agent.userId } : {}) }),
        Appointment.find({ phone: normalizedPhone, ...(agent?.userId ? { userId: agent.userId } : {}) }).sort({ date: -1 }).limit(3),
      ]);

      if (contact.status === 'fulfilled' && contact.value) {
        context.callerName = contact.value.name || '';
        context.callerEmail = contact.value.email || '';
        context.isReturningCustomer = true;
      } else if (lead.status === 'fulfilled' && lead.value) {
        context.callerName = lead.value.name || '';
        context.callerEmail = lead.value.email || '';
        context.isReturningCustomer = true;
      }

      if (pastAppts.status === 'fulfilled' && pastAppts.value?.length > 0) {
        context.pastAppointmentsCount = pastAppts.value.length;
        context.lastAppointment = {
          date: pastAppts.value[0].date,
          service: pastAppts.value[0].service,
          status: pastAppts.value[0].status,
        };
        context.isReturningCustomer = true;
      }

      // 2. Query Agent's external Webhook / CRM if configured
      const webhookUrl = agent?.crmIntegrations?.webhookUrl || agent?.webhookUrl;
      if (webhookUrl && typeof fetch !== 'undefined') {
        try {
          const controller = new AbortController();
          const abortTimer = setTimeout(() => controller.abort(), 1200);

          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(agent?.crmIntegrations?.customHeaders || {}),
            },
            body: JSON.stringify({
              event: 'pre_call_lookup',
              callerNumber: normalizedPhone,
              agentId: agent._id || agent.id,
            }),
            signal: controller.signal,
          });
          clearTimeout(abortTimer);

          if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              if (data.name) context.callerName = data.name;
              if (data.email) context.callerEmail = data.email;
              if (data.variables) Object.assign(context.customData, data.variables);
            }
          }
        } catch (webhookErr) {
          log.warn('pre_call_webhook_lookup_skipped', { error: webhookErr.message });
        }
      }
    } catch (err) {
      log.warn('pre_call_context_fetch_error', { error: err.message });
    }
    return context;
  })();

  // Timeout racer
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(context);
    }, timeoutMs);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}
