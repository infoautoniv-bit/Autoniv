import { log, IS_PROD } from '../services/logger.js';

export function requestLogger() {
  if (IS_PROD) {
    return (_req, _res, next) => next();
  }
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      log.info('http_request', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        ip: req.ip,
        userId: req.user?.userId,
        durationMs: Math.round(durationMs),
      });
    });
    next();
  };
}
