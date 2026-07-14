const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PROD = NODE_ENV === 'production';

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
    out = out.replace(pattern, (m) => {
      if (m.includes('@')) return '***@***';
      if (m.toLowerCase().startsWith('bearer ')) return 'Bearer ***';
      if (/^\+?\d{10,15}$/.test(m)) return '***PHONE***';
      return '***';
    });
  }
  return out;
}

function redactObject(obj, depth = 0) {
  if (depth > 6 || obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactObject(v, depth + 1));
  if (typeof obj !== 'object') return redactValue(obj);

  const out = {};
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
  const payload = { ts: ts(), level, msg: message };
  if (meta && Object.keys(meta).length) payload.meta = redactObject(meta);
  const line = safeStringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

function emitAlways(level, message, meta) {
  const payload = { ts: ts(), level, msg: message };
  if (meta && Object.keys(meta).length) payload.meta = redactObject(meta);
  const line = safeStringify(payload);
  if (level === 'error') process.stderr.write(line + '\n');
  else if (level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export const log = {
  info: (msg, meta) => emit('info', msg, meta),
  warn: (msg, meta) => emit('warn', msg, meta),
  error: (msg, meta) => emit('error', msg, meta),
  debug: (msg, meta) => {
    if (!IS_PROD) emit('debug', msg, meta);
  },
  fatal: (msg, meta) => emitAlways('error', msg, meta),
};

export function securityEvent(event, meta) {
  if (IS_PROD) return;
  emit('warn', `security.${event}`, meta);
}

export function redact(value) {
  return redactObject(value);
}

export default log;
