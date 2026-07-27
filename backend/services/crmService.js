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
 * Send secure HMAC-signed webhook to client CRM endpoint
 */
export async function sendCrmWebhook(webhookUrl, eventType, payload, secret) {
  if (!webhookUrl) return;

  const timestamp = String(Date.now());
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, secret, timestamp);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Autoniv-Event': eventType || 'lead_captured',
        'X-Autoniv-Timestamp': timestamp,
        'X-Autoniv-Signature': signature,
      },
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
 * Sync lead data to connected CRM platforms (HubSpot and Custom Webhooks)
 */
export async function syncLeadToCRM(entity, lead) {
  if (!entity) return;
  const crmIntegrations = entity.crmIntegrations || {
    hubspotToken: entity.hubspotToken,
    webhookUrl: entity.webhookUrl,
    webhookSecret: entity.webhookSecret,
  };
  if (!crmIntegrations.hubspotToken && !crmIntegrations.webhookUrl) return;

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
  if (crmIntegrations.hubspotToken) {
    try {
      const names = (leadData.name || '').trim().split(/\s+/);
      const firstName = names[0] || 'Lead';
      const lastName = names.slice(1).join(' ') || '';

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${crmIntegrations.hubspotToken}`,
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

  // 2. Sync to Custom Webhook with HMAC Signature
  if (crmIntegrations.webhookUrl) {
    await sendCrmWebhook(crmIntegrations.webhookUrl, 'lead_captured', leadData, crmIntegrations.webhookSecret);
  }
}
