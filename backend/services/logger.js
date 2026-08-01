import http from 'http';
import https from 'https';

const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PROD = NODE_ENV === 'production';

// ─── Optional log shipping endpoint ──────────────────────────────────────
const LOG_SHIP_URL = process.env.LOG_SHIP_URL; // e.g. Loki, Datadog, Elastic
const LOG_SHIP_API_KEY = process.env.LOG_SHIP_API_KEY;

function shipLog(payload) {
  if (!LOG_SHIP_URL) return;
  try {
    const body = JSON.stringify(payload);
    const url = new URL(LOG_SHIP_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(LOG_SHIP_API_KEY ? { Authorization: 'Bearer ' + LOG_SHIP_API_KEY } : {}),
      },
    };
    const req = (url.protocol === 'https:' ? https : http).request(options);
    req.on('error', () => {}); // swallow ship errors
    req.write(body);
    req.end();
  } catch {
    // Never let log shipping break the app
  }
}

const REDACT_KEYS = [
  'password',
  'token',
  'authorization',
  'jwt',
  'jwt_secret',
  'apikey',
  'api_key',
  'vapi_api_key',
  'groq_api_key',
  'admin_secret',
  'cookie',
  'mongodb_uri',
  'whatsapp_api_key',
  'webhook_secret',
  'vapi_webhook_secret',
  'cloudinary_api_secret',
];

const REDACT_VALUE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\b\+?\d{10,15}\b/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
];

function redactValue(value) {
  if (typeof value !== 'string') return value;
  let out = value;
  for (const pattern of REDACT_VALUE_PATTERNS) {
    out = out.replace(pattern, function (m) {
      if (m.includes('@')) return '***@***';
      if (m.toLowerCase().startsWith('bearer ')) return 'Bearer ***';
      if (/^\+?\d{10,15}$/.test(m)) return '***PHONE***';
      return '***';
    });
  }
  return out;
}

function redactObject(obj, depth) {
  if (depth === undefined) depth = 0;
  if (depth > 6 || obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(function (v) { return redactObject(v, depth + 1); });
  if (typeof obj !== 'object') return redactValue(obj);

  var out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_KEYS.includes(key.toLowerCase())) {
      out[key] = '***';
    } else {
      out[key] = redactObject(value, depth + 1);
    }
  }
  return out;
}

function ts() {
  return new Date().toISOString();
}

function safeStringify(obj) {
  try {
    return JSON.stringify(redactObject(obj));
  } catch {
    return '[unstringifiable]';
  }
}

function emit(level, message, meta) {
  const payload = { ts: ts(), level: level, msg: message };
  if (meta && Object.keys(meta).length) payload.meta = redactObject(meta);
  const line = safeStringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  if (IS_PROD) shipLog(payload);
}

function emitAlways(level, message, meta) {
  const payload = { ts: ts(), level: level, msg: message };
  if (meta && Object.keys(meta).length) payload.meta = redactObject(meta);
  const line = safeStringify(payload);
  if (level === 'error') process.stderr.write(line + '\n');
  else if (level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
  if (IS_PROD) shipLog(payload);
}

export const log = {
  info: function (msg, meta) { emit('info', msg, meta); },
  warn: function (msg, meta) { emit('warn', msg, meta); },
  error: function (msg, meta) { emit('error', msg, meta); },
  debug: function (msg, meta) {
    if (!IS_PROD) emit('debug', msg, meta);
  },
  fatal: function (msg, meta) { emitAlways('error', msg, meta); },
};

export function securityEvent(event, meta) {
  emitAlways('warn', 'security.' + event, meta);
}

export function redact(value) {
  return redactObject(value);
}

export default log;
