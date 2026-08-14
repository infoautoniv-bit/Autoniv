import User from '../../db/models/User.js';
import log from '../logger.js';

/**
 * Resets all active users' monthly usage counters.
 * Run once per billing cycle (1st of each month).
 */
export async function resetMonthlyUsage() {
  try {
    const result = await User.updateMany(
      {},
      {
        $set: {
          minutesUsed: 0,
          callsUsed: 0,
          chatUsed: 0,
        },
      }
    );

    log.info('usage_reset_complete', {
      usersUpdated: result.modifiedCount,
      timestamp: new Date().toISOString(),
    });

    return { success: true, usersUpdated: result.modifiedCount };
  } catch (error) {
    log.error('usage_reset_failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Calculates milliseconds until the next 1st of month at 00:00 UTC.
 */
function msUntilNextMonth() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 0, 0, 0, 0));
  // If we're already past the 1st, schedule for next month
  if (now.getUTCDate() === 1 && now.getUTCHours() < 1) {
    // It's the 1st and before midnight — reset now
    return 0;
  }
  return next.getTime() - now.getTime() + 60_000; // +1 min buffer past midnight
}

/**
 * Schedules automatic monthly usage resets.
 * Uses setTimeout chaining — no cron dependency.
 */
export function scheduleUsageReset() {
  function scheduleNext() {
    const delay = msUntilNextMonth();
    if (delay === 0) {
      // We're at the start of the month — reset now
      resetMonthlyUsage().finally(() => {
        setTimeout(scheduleNext, msUntilNextMonth());
      });
      return;
    }

    log.info('usage_reset_scheduled', {
      nextRun: new Date(Date.now() + delay).toISOString(),
      delayMs: delay,
    });

    setTimeout(async () => {
      await resetMonthlyUsage();
      scheduleNext();
    }, delay);
  }

  scheduleNext();
}
