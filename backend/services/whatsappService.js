import { log } from './logger.js';

const WHATSAPP_API_URL         = process.env.WHATSAPP_API_URL         || null;
const WHATSAPP_API_KEY         = process.env.WHATSAPP_API_KEY         || null;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
const BUSINESS_NAME            = process.env.BUSINESS_NAME            || 'Our Team';

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.trim().replace(/\D/g, '');
  if (!digits) return null;
  if (/^\d{10}$/.test(digits))    return `91${digits}`;
  if (/^\d{12,15}$/.test(digits)) return digits;
  if (/^0\d{10}$/.test(digits))   return `91${digits.slice(1)}`;
  log.warn('whatsapp_invalid_phone', { raw: phone, digits });
  return null;
}

function buildConfirmationMessage(appointment) {
  const name    = appointment.name || 'there';
  const service = appointment.service || 'your appointment';
  const date    = appointment.preferredDate || 'the scheduled date';
  const time    = appointment.preferredTime || 'the scheduled time';

  return [
    `Hi ${name},`,
    '',
    `Your appointment with ${BUSINESS_NAME} has been confirmed.`,
    '',
    `Service: ${service}`,
    `Date: ${date}`,
    `Time: ${time}`,
    '',
    'If you need to reschedule, please reply to this message.',
    `— ${BUSINESS_NAME}`,
  ].join('\n');
}

async function sendViaWhatsAppApi(toPhone, appointment) {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
    return null;
  }

  const url = `${WHATSAPP_API_URL.replace(/\/$/, '')}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const name    = appointment.name || 'there';
  const service = appointment.service || 'your appointment';
  const date    = appointment.preferredDate || 'the scheduled date';
  const time    = appointment.preferredTime || 'the scheduled time';

  // Use appointment_confirmation template
  const payload = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'template',
    template: {
      name: 'appointment_confirmation',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: BUSINESS_NAME },
            { type: 'text', text: service },
            { type: 'text', text: date },
            { type: 'text', text: time },
          ],
        },
      ],
    },
  };

  log.info('whatsapp_sending', { to: toPhone, name, service, date, time });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(`WhatsApp API ${res.status}: ${text}`);
  }

  return res.json().catch(() => ({}));
}

export async function sendAppointmentConfirmation(appointment) {
  const phone = normalizePhone(appointment?.phone);

  if (!phone) {
    log.warn('whatsapp_no_phone', { appointmentId: appointment?._id });
    return { success: false, channel: 'whatsapp', error: 'No valid phone number on appointment' };
  }

  try {
    const apiResponse = await sendViaWhatsAppApi(phone, appointment);
    if (apiResponse) {
      const messageId = apiResponse.messages?.[0]?.id ?? null;
      log.info('whatsapp_sent', { messageId, sentTo: phone });
      return { success: true, channel: 'whatsapp', messageId, sentTo: phone };
    }
    const fakeId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    log.info('whatsapp_simulated', { messageId: fakeId, sentTo: phone });
    return { success: true, channel: 'whatsapp', messageId: fakeId, sentTo: phone, simulated: true };
  } catch (err) {
    log.error('whatsapp_send_failed', { error: err.message, sentTo: phone });
    return { success: false, channel: 'whatsapp', error: err.message, sentTo: phone };
  }
}

export default { sendAppointmentConfirmation };