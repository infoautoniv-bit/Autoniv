import crypto from 'node:crypto';
import { IS_PROD, log } from '../logger.js';

const TTL_MS = 5 * 60 * 1000;

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

export function signMediaStreamToken(agentId) {
  const secret = getSecret();
  if (!secret || !agentId) return null;
  const exp = new Date().getTime() + TTL_MS;
  return `${exp}.${sign(agentId, exp, secret)}`;
}

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
