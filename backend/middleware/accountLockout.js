import User from '../db/models/User.js';
import { securityEvent } from '../services/logger.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_AFTER_MS = 30 * 60 * 1000;

export function isAccountLocked(user) {
  if (!user) return false;
  if (user.lockUntil && user.lockUntil > new Date()) return true;
  return false;
}

export function getLockRemainingMs(user) {
  if (!user?.lockUntil) return 0;
  const remaining = user.lockUntil.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function recordFailedLogin(user) {
  if (!user) return;
  const attempts = (user.loginAttempts || 0) + 1;
  const updates = { loginAttempts: attempts };
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    updates.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    updates.loginAttempts = 0;
    securityEvent('account_locked', { userId: String(user._id), email: user.email });
  }
  await User.updateOne({ _id: user._id }, { $set: updates });
}

export async function recordSuccessfulLogin(user) {
  if (!user) return;
  await User.updateOne(
    { _id: user._id },
    { $set: { loginAttempts: 0 }, $unset: { lockUntil: '' } },
  );
}

export const LOCKOUT_POLICY = Object.freeze({
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  lockDurationMs: LOCK_DURATION_MS,
  resetAfterMs: RESET_AFTER_MS,
});
