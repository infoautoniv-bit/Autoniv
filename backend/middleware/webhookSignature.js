import crypto from 'node:crypto';
import { IS_PROD, securityEvent, log } from '../services/logger.js';

const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET;

if (!VAPI_WEBHOOK_SECRET && IS_PROD) {
  log.warn('vapi_webhook_secret_missing_webhooks_will_be_rejected');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function getRawBody(req) {
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body), 'utf8');
  return null;
}

function verifyWithSecret(secret, headerSig, rawBody) {
  if (!headerSig) return false;
  const cleaned = headerSig.startsWith('sha256=') ? headerSig.slice(7) : headerSig;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(cleaned, expected);
}

export function verifyVapiSignature(req, res, next) {
  if (!VAPI_WEBHOOK_SECRET) {
    if (IS_PROD) {
      log.warn('vapi_webhook_secret_missing');
    }
    return next();
  }

  const headerSig =
    req.headers['x-vapi-signature'] ||
    req.headers['vapi-signature'] ||
    req.headers['x-signature'];

  // If Vapi isn't sending a signature, allow through (secret may not be
  // configured on the Vapi dashboard side).  Only reject when a signature
  // IS present but doesn't match — that indicates tampering.
  if (!headerSig) {
    log.warn('vapi_webhook_no_signature_header', { ip: req.ip });
    return next();
  }

  const rawBody = getRawBody(req);
  if (!rawBody) {
    securityEvent('webhook_no_body', { ip: req.ip });
    return res.status(400).json({ message: 'Missing body' });
  }

  if (!verifyWithSecret(VAPI_WEBHOOK_SECRET, headerSig, rawBody)) {
    securityEvent('webhook_bad_signature', { ip: req.ip });
    return res.status(401).json({ message: 'Invalid signature' });
  }

  return next();
}
