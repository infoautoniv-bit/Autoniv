import { log } from '../logger.js';

/**
 * Configure a Twilio phone number's voice webhook to point to our incoming-call endpoint.
 * Extracted from agents.js route to keep route files focused on HTTP concerns.
 */
export async function configureTwilioIncomingWebhook(twilioAccountSid, twilioAuthToken, phoneNumber, webhookUrl) {
  const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

  // 1. List incoming numbers in Twilio (up to 100)
  const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json?PageSize=100`;

  const searchRes = await fetch(searchUrl, {
    headers: { 'Authorization': `Basic ${auth}` }
  });

  if (!searchRes.ok) {
    const errorBody = await searchRes.text().catch(() => '');
    throw new Error(`Failed to list Twilio phone numbers: ${searchRes.statusText}. Details: ${errorBody}`);
  }

  const searchData = await searchRes.json();
  const phoneNumbers = searchData.incoming_phone_numbers || [];

  // 2. Perform lenient matching on the phone number digits
  const cleanSearchNum = phoneNumber.replace(/\D/g, '');
  if (!cleanSearchNum) {
    throw new Error('Invalid phone number format provided.');
  }

  const match = phoneNumbers.find(p => {
    const cleanTwilioNum = (p.phone_number || '').replace(/\D/g, '');
    return cleanTwilioNum === cleanSearchNum ||
           cleanTwilioNum.endsWith(cleanSearchNum) ||
           cleanSearchNum.endsWith(cleanTwilioNum);
  });

  if (!match) {
    const available = phoneNumbers.map(p => p.phone_number).join(', ');
    throw new Error(`Phone number "${phoneNumber}" not found in your Twilio account. Available numbers in your account: ${available || 'none'}`);
  }

  const phoneSid = match.sid;

  // 3. Update the VoiceUrl, VoiceFallbackUrl, and StatusCallback webhooks
  const updateUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers/${phoneSid}.json`;

  const params = new URLSearchParams();
  params.append('VoiceUrl', webhookUrl);
  params.append('VoiceMethod', 'POST');
  params.append('VoiceFallbackUrl', webhookUrl);
  params.append('VoiceFallbackMethod', 'POST');

  const base = webhookUrl.replace(/\/$/, '');
  const statusCallbackUrl = base.replace(/\/incoming-call$/, '') + '/twilio/status';
  params.append('StatusCallback', statusCallbackUrl);
  params.append('StatusCallbackMethod', 'POST');

  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!updateRes.ok) {
    const errorBody = await updateRes.text().catch(() => '');
    throw new Error(`Failed to configure Twilio webhook: ${updateRes.statusText}. Details: ${errorBody}`);
  }

  log.info('twilio_webhook_configured', { phoneNumber, webhookUrl });
}
