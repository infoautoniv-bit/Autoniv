import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { securityEvent } from '../services/logger.js';

function makeHandler(name) {
  return (req, res) => {
    securityEvent('rate_limit', {
      limiter: name,
      ip: req.ip,
      path: req.originalUrl,
    });

    res.status(429).json({
      message: 'Too many requests, please slow down.',
      retryAfter: res.getHeader('Retry-After'),
    });
  };
}

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: makeHandler('global'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${req.body?.email || 'anon'}`,
  handler: makeHandler('auth'),
});

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${req.body?.email || 'anon'}`,
  handler: makeHandler('login'),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: makeHandler('register'),
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: makeHandler('webhook'),
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.userId
      ? `user:${req.user.userId}`
      : ipKeyGenerator(req.ip),
  handler: makeHandler('write'),
});

export default {
  globalLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  webhookLimiter,
  writeLimiter,
};