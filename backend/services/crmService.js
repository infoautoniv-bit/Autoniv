import crypto from 'crypto';
import { log } from './logger.js';

/**
 * Generate HMAC SHA-256 signature for outgoing webhook payload
 */
export function generateWebhookSignature(payloadString, secret, timestamp) {
  const hmacSecret = secret || process.env.WEBHOOK_SECRET || 'autoniv_hmac_secret';
  const signaturePayload = `${timestamp}.${payloadString}`;
  const hmac = crypto.createHmac('sha256', hmacSecret).update(signaturePayload).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

/**
 * Apply field mapping to rename keys in a payload object.
 * Example: { name: 'John', phone: '123' } with mapping { name: 'fullName', phone: 'mobile' }
 * returns { fullName: 'John', mobile: '123' }
 */
export function applyFieldMapping(data, mapping) {
  if (!mapping || typeof mapping !== 'object') return data;
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = mapping[key] || key;
    result[newKey] = value;
  }
  return result;
}

/**
 * Render a Handlebars-style payload template with variable substitution.
 * Template: { "contact": { "name": "{{name}}", "phone": "{{phone}}" } }
 * Supports dot notation: {{metadata.context.jobRole}}
 */
export function renderPayloadTemplate(template, data) {
  if (!template) return null;
  try {
    const rendered = template.replace(/\{\{(.+?)\}\}/g, (match, path) => {
      const keys = path.trim().split('.');
      let value = data;
      for (const key of keys) {
        if (value === null || value === undefined) return '';
        value = value[key];
      }
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    return JSON.parse(rendered);
  } catch (err) {
    log.error('crm_payload_template_render_failed', { error: err.message });
    return null;
  }
}

/**
 * Send secure HMAC-signed webhook to client CRM endpoint
 */
export async function sendCrmWebhook(webhookUrl, eventType, payload, secret, crmConfig) {
  if (!webhookUrl) return;

  let finalPayload = payload;

  // 1. Apply custom payload template if provided
  if (crmConfig?.payloadTemplate) {
    const rendered = renderPayloadTemplate(crmConfig.payloadTemplate, payload);
    if (rendered) {
      finalPayload = rendered;
    } else {
      log.warn('crm_template_render_fell_back_to_raw', { webhookUrl });
      finalPayload = payload;
    }
  }

  // 2. Apply field mapping if provided (and no template was used)
  if (!crmConfig?.payloadTemplate && crmConfig?.fieldMapping) {
    finalPayload = applyFieldMapping(payload, crmConfig.fieldMapping);
  }

  const timestamp = String(Date.now());
  const payloadString = typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload);
  const signature = generateWebhookSignature(payloadString, secret, timestamp);

  // 3. Build headers — merge custom headers if provided
  const headers = {
    'Content-Type': 'application/json',
    'X-Autoniv-Event': eventType || 'lead_captured',
    'X-Autoniv-Timestamp': timestamp,
    'X-Autoniv-Signature': signature,
    ...(crmConfig?.customHeaders || {}),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payloadString,
    });

    if (!response.ok) {
      log.error('crm_webhook_delivery_failed', { webhookUrl, status: response.status });
    } else {
      log.info('crm_webhook_delivery_success', { webhookUrl, eventType });
    }
  } catch (err) {
    log.error('crm_webhook_delivery_error', { webhookUrl, error: err.message });
  }
}

/**
 * Extract crmIntegrations config from an entity (Agent, Chatbot, User)
 */
function getCrmConfig(entity) {
  if (!entity) return {};
  const crm = entity.crmIntegrations || {};
  return {
    hubspotToken: crm.hubspotToken || entity.hubspotToken || null,
    webhookUrl: crm.webhookUrl || entity.webhookUrl || null,
    webhookSecret: crm.webhookSecret || entity.webhookSecret || null,
    fieldMapping: crm.fieldMapping || null,
    customHeaders: crm.customHeaders || null,
    payloadTemplate: crm.payloadTemplate || null,
  };
}

/**
 * Sync lead data to connected CRM platforms (HubSpot and Custom Webhooks)
 */
export async function syncLeadToCRM(entity, lead) {
  if (!entity) return;
  const crm = getCrmConfig(entity);
  if (!crm.hubspotToken && !crm.webhookUrl) return;

  const leadData = {
    name: lead.name || 'Lead',
    phone: lead.phone || '',
    email: lead.email || '',
    purpose: lead.purpose || '',
    notes: lead.notes || '',
    agentId: lead.agentId ? String(lead.agentId) : null,
    chatbotId: lead.chatbotId ? String(lead.chatbotId) : null,
    leadType: lead.leadType || 'call',
    createdAt: new Date().toISOString(),
  };

  // 1. Sync to HubSpot
  if (crm.hubspotToken) {
    try {
      const names = (leadData.name || '').trim().split(/\s+/);
      const firstName = names[0] || 'Lead';
      const lastName = names.slice(1).join(' ') || '';

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${crm.hubspotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            phone: leadData.phone,
            email: leadData.email,
            notes: `${leadData.notes} ${leadData.purpose ? `[Purpose: ${leadData.purpose}]` : ''}`.trim(),
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        log.error('crm_sync_hubspot_failed', { entityId: entity._id, status: response.status, error: errText });
      } else {
        log.info('crm_sync_hubspot_success', { entityId: entity._id });
      }
    } catch (err) {
      log.error('crm_sync_hubspot_error', { entityId: entity._id, error: err.message });
    }
  }

  // 2. Sync to Custom Webhook with field mapping / template support
  if (crm.webhookUrl) {
    await sendCrmWebhook(crm.webhookUrl, 'lead_captured', leadData, crm.webhookSecret, crm);
  }
}

/**
 * Sync appointment data to connected CRM platforms (HubSpot and Custom Webhooks)
 */
export async function syncAppointmentToCRM(entity, appointment) {
  if (!entity) return;
  const crm = getCrmConfig(entity);
  if (!crm.hubspotToken && !crm.webhookUrl) return;

  const appointmentData = {
    name: appointment.name || 'Appointment',
    phone: appointment.phone || '',
    email: appointment.email || '',
    service: appointment.service || '',
    provider: appointment.provider || '',
    patientType: appointment.patientType || '',
    preferredDate: appointment.preferredDate || '',
    preferredTime: appointment.preferredTime || '',
    status: appointment.status || 'pending',
    agentId: appointment.agentId ? String(appointment.agentId) : null,
    callId: appointment.callId ? String(appointment.callId) : null,
    createdAt: new Date().toISOString(),
  };

  // 1. Sync to HubSpot
  if (crm.hubspotToken) {
    try {
      const names = (appointmentData.name || '').trim().split(/\s+/);
      const firstName = names[0] || 'Appointment';
      const lastName = names.slice(1).join(' ') || '';

      const notes = [
        appointmentData.service ? `Service: ${appointmentData.service}` : '',
        appointmentData.provider ? `Provider: ${appointmentData.provider}` : '',
        appointmentData.preferredDate ? `Date: ${appointmentData.preferredDate}` : '',
        appointmentData.preferredTime ? `Time: ${appointmentData.preferredTime}` : '',
        appointmentData.patientType ? `Type: ${appointmentData.patientType}` : '',
      ].filter(Boolean).join(' | ');

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${crm.hubspotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            phone: appointmentData.phone,
            email: appointmentData.email,
            notes: notes || `Appointment ${appointmentData.status}`,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        log.error('crm_sync_hubspot_appointment_failed', { entityId: entity._id, status: response.status, error: errText });
      } else {
        log.info('crm_sync_hubspot_appointment_success', { entityId: entity._id });
      }
    } catch (err) {
      log.error('crm_sync_hubspot_appointment_error', { entityId: entity._id, error: err.message });
    }
  }

  // 2. Sync to Custom Webhook with field mapping / template support
  if (crm.webhookUrl) {
    await sendCrmWebhook(crm.webhookUrl, 'appointment_created', appointmentData, crm.webhookSecret, crm);
  }
}
