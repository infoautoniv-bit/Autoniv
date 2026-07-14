import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cors from 'cors';
import { IS_PROD, log } from '../services/logger.js';

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
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Vapi-Signature', 'X-Request-Id', 'X-Api-Key', 'x-api-key'],
        exposedHeaders: ['X-Request-Id'],
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
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: IS_PROD
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  });
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
