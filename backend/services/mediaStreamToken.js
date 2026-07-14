import crypto from 'node:crypto';
import { IS_PROD, log } from './logger.js';

// Short-lived token that authorizes a Twilio Media Stream connection to
// /media-stream. Minted in the TwiML response and verified on WS connect so
// only calls we just answered can open a stream (and rack up vendor spend).
const TTL_MS = 5 * 60 * 1000; // Twilio connects within seconds; 5 min is ample.

function getSecret() {
  return process.env.MEDIA_STREAM_SECRET || process.env.JWT_SECRET || null;
}

function sign(agentId, exp, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${agentId}.${exp}`)
    .digest('base64url');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Create a token bound to a specific agentId. Returns null when no secret is
 * configured (dev) — callers then simply omit the token and enforcement is off.
 */
export function signMediaStreamToken(agentId) {
  const secret = getSecret();
  if (!secret || !agentId) return null;
  const exp = new Date().getTime() + TTL_MS;
  return `${exp}.${sign(agentId, exp, secret)}`;
}

/**
 * Verify a token for a given agentId. Returns true when valid, and also true
 * when no secret is configured (can't enforce — fail open in dev, warn in prod).
 */
export function verifyMediaStreamToken(agentId, token) {
  const secret = getSecret();
  if (!secret) {
    if (IS_PROD) log.warn('media_stream_token_no_secret');
    return true;
  }
  if (!token || !agentId) return false;

  const dot = token.indexOf('.');
  if (dot < 1) return false;

  const exp = Number(token.slice(0, dot));
  const mac = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < new Date().getTime()) return false;

  return safeEqual(sign(agentId, exp, secret), mac);
}
