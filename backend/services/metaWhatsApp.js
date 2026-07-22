import { log } from './logger.js';

// ─── Meta Graph API config ────────────────────────────────────────────────────
// Embedded Signup (WhatsApp) requires a Meta App with the WhatsApp product and a
// configured Embedded Signup flow. These are platform-level (our) credentials.
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v20.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const APP_ID = process.env.META_APP_ID || null;
const APP_SECRET = process.env.META_APP_SECRET || null;

function assertConfigured() {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('Meta app not configured (META_APP_ID / META_APP_SECRET missing)');
  }
}

async function graphFetch(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const message = data?.error?.message || `Graph API error (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.graph = data?.error || data;
    throw err;
  }
  return data;
}

// ─── 1. Exchange the Embedded Signup `code` for an access token ────────────────
// The Facebook JS SDK returns a short-lived authorization `code`; we exchange it
// server-side (client_secret never leaves the backend) for a business token.
export async function exchangeCodeForToken(code) {
  assertConfigured();
  if (!code) throw new Error('Authorization code is required');

  const url = `${GRAPH_BASE}/oauth/access_token`
    + `?client_id=${encodeURIComponent(APP_ID)}`
    + `&client_secret=${encodeURIComponent(APP_SECRET)}`
    + `&code=${encodeURIComponent(code)}`;

  const data = await graphFetch(url);
  if (!data.access_token) throw new Error('No access_token returned from Meta');
  return {
    accessToken: data.access_token,
    tokenType: data.token_type || 'bearer',
    expiresIn: data.expires_in || null, // seconds; often absent for business tokens
  };
}

// ─── 2. Resolve phone number details for a WABA ───────────────────────────────
export async function getWabaPhoneNumbers(wabaId, token) {
  if (!wabaId) throw new Error('wabaId is required');
  if (!token) throw new Error('access token is required');

  const url = `${GRAPH_BASE}/${encodeURIComponent(wabaId)}/phone_numbers`
    + `?fields=id,display_phone_number,verified_name,code_verification_status`;

  const data = await graphFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(data.data) ? data.data : [];
}

// ─── 3. Subscribe our app to the WABA so our webhook receives its messages ─────
export async function subscribeWabaToApp(wabaId, token) {
  if (!wabaId) throw new Error('wabaId is required');
  if (!token) throw new Error('access token is required');

  const url = `${GRAPH_BASE}/${encodeURIComponent(wabaId)}/subscribed_apps`;
  const data = await graphFetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return data?.success === true;
}

// ─── 4. Register a phone number on the Cloud API (optional) ────────────────────
// Needed for freshly-created numbers before they can send/receive. A PIN is only
// required when two-step verification is enabled; we send a default here.
export async function registerPhoneNumber(phoneNumberId, token, pin = '000000') {
  if (!phoneNumberId || !token) throw new Error('phoneNumberId and token are required');
  const url = `${GRAPH_BASE}/${encodeURIComponent(phoneNumberId)}/register`;
  try {
    const data = await graphFetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
    });
    return data?.success === true;
  } catch (err) {
    // Registration failures are non-fatal for connect (number may already be registered).
    log.warn('meta_register_phone_failed', { phoneNumberId, error: err.message });
    return false;
  }
}

export function isMetaConfigured() {
  return Boolean(APP_ID && APP_SECRET);
}

export default {
  exchangeCodeForToken,
  getWabaPhoneNumbers,
  subscribeWabaToApp,
  registerPhoneNumber,
  isMetaConfigured,
};
