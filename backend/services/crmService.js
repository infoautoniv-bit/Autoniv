import { log } from './logger.js';

/**
 * Sync lead data to connected CRM platforms (HubSpot and Custom Webhooks)
 */
export async function syncLeadToCRM(chatbot, lead) {
  const { crmIntegrations } = chatbot;
  if (!crmIntegrations) return;

  const leadData = {
    name: lead.name,
    phone: lead.phone,
    email: lead.email || '',
    notes: lead.notes || '',
    chatbotId: String(chatbot._id),
    channel: lead.channel || 'unknown',
    createdAt: new Date().toISOString()
  };

  // 1. Sync to HubSpot
  if (crmIntegrations.hubspotToken) {
    try {
      const names = leadData.name.trim().split(/\s+/);
      const firstName = names[0] || 'Lead';
      const lastName = names.slice(1).join(' ') || '';

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${crmIntegrations.hubspotToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            phone: leadData.phone,
            email: leadData.email,
            notes: leadData.notes
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        log.error('crm_sync_hubspot_failed', { chatbotId: chatbot._id, status: response.status, error: errText });
      } else {
        log.info('crm_sync_hubspot_success', { chatbotId: chatbot._id });
      }
    } catch (err) {
      log.error('crm_sync_hubspot_error', { chatbotId: chatbot._id, error: err.message });
    }
  }

  // 2. Sync to Custom Webhook
  if (crmIntegrations.webhookUrl) {
    try {
      const response = await fetch(crmIntegrations.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Autoniv-Event': 'lead_captured'
        },
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        log.error('crm_sync_webhook_failed', { chatbotId: chatbot._id, status: response.status });
      } else {
        log.info('crm_sync_webhook_success', { chatbotId: chatbot._id });
      }
    } catch (err) {
      log.error('crm_sync_webhook_error', { chatbotId: chatbot._id, error: err.message });
    }
  }
}
