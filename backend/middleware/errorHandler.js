import { IS_PROD, log, securityEvent } from '../services/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Not found' });
}

export function errorHandler(err, req, res, _next) {
  const requestId = req.id;

  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large', requestId });
  }
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ message: 'Invalid JSON body', requestId });
  }
  if (err && err.message && err.message.startsWith('CORS:')) {
    securityEvent('cors_violation', { ip: req.ip, origin: req.headers.origin });
    return res.status(403).json({ message: 'Origin not allowed', requestId });
  }

  if (err && err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value', requestId });
  }
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message, requestId });
  }
  if (err && err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier', requestId });
  }

  if (err && err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      message: err.message || 'Request failed',
      requestId,
    });
  }

  log.error('unhandled_error', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    message: err?.message,
    stack: IS_PROD ? undefined : err?.stack,
  });

  return res.status(500).json({
    message: 'Internal server error',
    requestId,
  });
}
