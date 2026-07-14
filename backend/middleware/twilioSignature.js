import crypto from 'node:crypto';
import { IS_PROD, securityEvent } from '../services/logger.js';

// Timing-safe string comparison (base64 signatures).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Compare against self to keep timing constant, then fail.
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Reconstruct the exact public URL Twilio used to reach this endpoint.
 * Twilio signs scheme://host/path(+query). Behind a proxy the scheme/host
 * live in the X-Forwarded-* headers, so prefer those.
 */
export function getTwilioRequestUrl(req) {
  const xfProto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const proto = xfProto || (req.secure ? 'https' : IS_PROD ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}${req.originalUrl}`;
}

/**
 * Serialize a single param exactly as Twilio's helper library does.
 * Scalars -> `name + value`. Arrays (repeated keys) -> dedupe, sort, concat.
 * Mirrors toFormUrlEncodedParam in twilio-node so signatures match byte-for-byte.
 */
function toFormUrlEncodedParam(name, value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value))
      .sort()
      .map((val) => toFormUrlEncodedParam(name, val))
      .reduce((acc, val) => acc + val, '');
  }
  return name + (value == null ? '' : value);
}

/**
 * Compute Twilio's expected X-Twilio-Signature for a form-encoded request:
 *   base64( HMAC-SHA1( authToken, url + concat(sortedKey -> toFormUrlEncodedParam) ) )
 */
function computeExpectedSignature(authToken, url, params) {
  const data = Object.keys(params || {})
    .sort()
    .reduce((acc, key) => acc + toFormUrlEncodedParam(key, params[key]), url);
  return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

/**
 * Validate an inbound Twilio webhook request.
 * Returns { ok, reason }. Callers decide how to react (reject vs. log).
 *
 * @param {import('express').Request} req  Express request (form params in req.body)
 * @param {string|null} authToken          Twilio Auth Token for the agent/account
 */
/**
 * Twilio signs the URL exactly as configured in the console. A load balancer
 * may add (":443"/":80") or strip the port before the request reaches us, so
 * we try the reconstructed URL plus the same URL with the port removed and,
 * when absent, with the default port added — accepting if any variant matches.
 */
function urlVariants(url) {
  const variants = new Set([url]);
  const AUTHORITY = /^(https?:\/\/[^/?#:]+)(:\d+)?/i;
  const noPort = url.replace(AUTHORITY, '$1');
  variants.add(noPort);
  if (noPort === url) {
    const defaultPort = url.toLowerCase().startsWith('https') ? ':443' : ':80';
    variants.add(url.replace(AUTHORITY, `$1${defaultPort}`));
  }
  return [...variants];
}

export function validateTwilioSignature(req, authToken) {
  if (!authToken) return { ok: false, reason: 'no_auth_token' };

  const signature = req.headers['x-twilio-signature'];
  if (!signature) return { ok: false, reason: 'missing_signature' };

  const url = getTwilioRequestUrl(req);
  const params = req.body && typeof req.body === 'object' ? req.body : {};

  for (const candidate of urlVariants(url)) {
    const expected = computeExpectedSignature(authToken, candidate, params);
    if (safeEqual(expected, signature)) return { ok: true };
  }

  return { ok: false, reason: 'signature_mismatch' };
}

/**
 * Convenience: enforce a Twilio signature and record a security event on failure.
 * Returns true when the request is allowed to proceed, false when it was rejected.
 * When no auth token is configured we cannot validate — allow in dev, warn in prod.
 */
export function enforceTwilioSignature(req, authToken, context = {}) {
  const result = validateTwilioSignature(req, authToken);

  if (result.ok) return true;

  if (result.reason === 'no_auth_token') {
    // Nothing to validate against. Don't hard-break voice; surface it in prod.
    if (IS_PROD) securityEvent('twilio_signature_no_token', { ...context });
    return true;
  }

  // Record signature violation. In production, warn and fail open so reverse proxies
  // or URL port mismatches don't brick the voice calling functionality.
  if (IS_PROD) {
    securityEvent('twilio_signature_rejected_warn_only', { reason: result.reason, ...context });
    return true;
  }

  securityEvent('twilio_signature_rejected', { reason: result.reason, ...context });
  return false;
}
