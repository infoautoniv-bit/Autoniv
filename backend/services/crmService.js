import { log } from './logger.js';

/**
 * Sync lead data to connected CRM platforms (HubSpot and Custom Webhooks)
 */
export async function syncLeadToCRM(entity, lead) {
  if (!entity) return;
  const crmIntegrations = entity.crmIntegrations || {
    hubspotToken: entity.hubspotToken,
    webhookUrl: entity.webhookUrl,
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
    createdAt: new Date().toISOString()
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            phone: leadData.phone,
            email: leadData.email,
            notes: `${leadData.notes} ${leadData.purpose ? `[Purpose: ${leadData.purpose}]` : ''}`.trim()
          }
        })
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
        log.error('crm_sync_webhook_failed', { entityId: entity._id, status: response.status });
      } else {
        log.info('crm_sync_webhook_success', { entityId: entity._id });
      }
    } catch (err) {
      log.error('crm_sync_webhook_error', { entityId: entity._id, error: err.message });
    }
  }
}
