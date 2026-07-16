import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cors from 'cors';
import crypto from 'crypto';
import { IS_PROD, log } from '../services/logger.js';
import { verifyAccessToken } from '../services/tokenService.js';
import { extractTokenFromCookie } from '../services/cookieService.js';

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://localhost:5173',
  'https://localhost:3000',
  'https://127.0.0.1:5173',
  'https://dashboard.vapi.ai',
];

function buildAllowedOrigins() {
  const list = new Set(DEFAULT_ORIGINS);
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean).forEach((o) => list.add(o));
  }
  if (process.env.ADMIN_FRONTEND_URL) {
    process.env.ADMIN_FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean).forEach((o) => list.add(o));
  }
  return Array.from(list);
}

export function buildCors() {
  return cors((req, cb) => {
    const origin = req.header('Origin');
    const isWidgetRoute = req.path && req.path.startsWith('/api/widget');

    if (isWidgetRoute) {
      cb(null, {
        origin: origin || '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Api-Key', 'x-api-key'],
        exposedHeaders: ['X-Request-Id'],
        credentials: true,
        maxAge: 600,
      });
      return;
    }

    const allow = buildAllowedOrigins();
    if (!origin || allow.includes(origin)) {
      cb(null, {
        origin: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Vapi-Signature', 'X-Request-Id', 'X-Api-Key', 'x-api-key', 'X-CSRF-Token'],
        exposedHeaders: ['X-Request-Id', 'X-CSRF-Token'],
        credentials: true,
        maxAge: 600,
      });
    } else {
      cb(new Error('CORS: origin not allowed'));
    }
  });
}

export function buildHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
          'https://www.clarity.ms',
          'https://bat.bing.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        mediaSrc: ["'self'", 'blob:', 'https://*.cloudinary.com'],
        connectSrc: [
          "'self'",
          'https://api.vapi.ai',
          'https://api.resend.com',
          'https://*.cloudinary.com',
          'https://www.google-analytics.com',
          'https://www.clarity.ms',
          'wss:',
        ],
        frameSrc: ["'self'", 'https://www.youtube.com', 'https://player.vimeo.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: IS_PROD ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: IS_PROD
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  });
}

// ─── CSRF Protection ────────────────────────────────────────────────────────

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) return token.trim();
  }
  return extractTokenFromCookie(req);
}

function resolveSessionId(req) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.userId) {
        return String(decoded.userId);
      }
    }
  } catch (err) {
    // Ignore verification errors
  }

  // Fallback to cookie-based session ID
  let cookieSession = req.cookies?.csrfSessionId;
  if (!cookieSession) {
    cookieSession = req.ip || 'anonymous';
  }
  return cookieSession;
}

function generateCsrfToken(sessionId) {
  const payload = `${sessionId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function verifyCsrfToken(token, sessionId) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;

    const [tokenSessionId, timestamp, random, signature] = parts;
    const payload = `${tokenSessionId}:${timestamp}:${random}`;
    const expectedSignature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return false;
    }

    if (tokenSessionId !== sessionId) return false;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CSRF_TOKEN_EXPIRY) return false;

    return true;
  } catch {
    return false;
  }
}

export function csrfProtection(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for webhook routes (verified by signature)
  if (req.path?.startsWith('/api/webhooks') || req.path?.startsWith('/api/twilio')) {
    return next();
  }

  // Skip for widget routes (verified by API key)
  if (req.path?.startsWith('/api/widget')) {
    return next();
  }

  // Skip for auth routes (protected by rate limiting)
  if (req.path?.startsWith('/api/auth')) {
    return next();
  }

  const sessionId = resolveSessionId(req);
  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!csrfToken || !verifyCsrfToken(csrfToken, sessionId)) {
    log.warn('csrf_validation_failed', {
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(403).json({ message: 'Invalid or missing CSRF token' });
  }

  next();
}

export function csrfTokenEndpoint(req, res) {
  let sessionId = resolveSessionId(req);
  const token = extractToken(req);
  let isAuthed = false;
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.userId) isAuthed = true;
    } catch (err) {
      // Ignore
    }
  }

  if (!isAuthed && !req.cookies?.csrfSessionId) {
    const newCookieSessionId = crypto.randomBytes(16).toString('hex');
    res.cookie('csrfSessionId', newCookieSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    sessionId = newCookieSessionId;
  }
  const csrfToken = generateCsrfToken(sessionId);
  res.json({ csrfToken });
}

export const mongoSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    if (!req._sanitizeLog) {
      req._sanitizeLog = new Set();
    }
    if (!req._sanitizeLog.has(key)) {
      req._sanitizeLog.add(key);
      log.warn('nosql_injection_blocked', { key, ip: req.ip, path: req.originalUrl });
    }
  },
});

export const hppGuard = hpp({
  whitelist: ['status', 'limit', 'period'],
});
