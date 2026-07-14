import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { log, securityEvent } from '../services/logger.js';

const router = express.Router();
const VAPI_BASE = 'https://api.vapi.ai';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);

function isAllowedPath(path) {
  if (typeof path !== 'string') return false;
  if (path.length > 200) return false;
  if (path.includes('..')) return false;
  if (path.includes('\0')) return false;
  return /^(\/(assistant|call|phone-number|tool)(\/[A-Za-z0-9._-]+)?(\?.*)?$|\/(assistant|call|phone-number|tool)$)/.test(path);
}

router.use(authenticate);
router.use(requireAdmin);

router.all('/*', async (req, res) => {
  const path = req.path;
  if (!ALLOWED_METHODS.has(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAllowedPath(path)) {
    securityEvent('vapi_proxy_blocked_path', { ip: req.ip, path, userId: req.user?.userId });
    return res.status(400).json({ error: 'Invalid path' });
  }

  const queryString = Object.keys(req.query).length
    ? '?' + new URLSearchParams(req.query).toString()
    : '';
  const vapiUrl = `${VAPI_BASE}${path}${queryString}`;

  try {
    const options = {
      method: req.method,
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };
    if (!['GET', 'HEAD', 'DELETE'].includes(req.method)) {
      const bodyStr = req.body ? JSON.stringify(req.body) : undefined;
      if (bodyStr && bodyStr.length > 1_000_000) {
        return res.status(413).json({ error: 'Request body too large' });
      }
      options.body = bodyStr;
    }

    const response = await fetch(vapiUrl, options);
    const text = await response.text();

    log.info('vapi_proxy_call', {
      userId: req.user?.userId,
      method: req.method,
      path,
      status: response.status,
    });

    res.status(response.status);
    res.set('Content-Type', 'application/json');
    res.set('Cache-Control', 'no-store');
    res.send(text);
  } catch (err) {
    log.error('vapi_proxy_error', { error: err.message, path });
    res.status(502).json({ error: 'Upstream request failed' });
  }
});

export default router;
