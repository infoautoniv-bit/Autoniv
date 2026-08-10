/**
 * Simple in-memory idempotency guard for webhook processing.
 * Prevents duplicate processing of the same webhook event (e.g., Vapi retries).
 *
 * In production, replace with Redis-backed store for multi-instance deployments.
 */

const processedEvents = new Map();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of processedEvents) {
    if (now - timestamp > TTL_MS) {
      processedEvents.delete(key);
    }
  }
}, 60_000).unref?.();

/**
 * Check if an event has already been processed. If not, mark it as processed.
 * @param {string} eventId - Unique event identifier (e.g., callSid + eventType)
 * @returns {boolean} true if this is a duplicate event
 */
export function isDuplicateEvent(eventId) {
  if (!eventId) return false;
  if (processedEvents.has(eventId)) return true;
  processedEvents.set(eventId, Date.now());
  return false;
}

/**
 * Express middleware that enforces idempotency based on X-Idempotency-Key header
 * or a computed key from the request body.
 */
export function idempotencyGuard(keyFn) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.headers['x-idempotency-key'];
    if (!key) return next();

    if (isDuplicateEvent(key)) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    next();
  };
}
