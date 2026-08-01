import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    }
    // Report to Sentry in production
    const [message, ...rest] = args;
    if (message instanceof Error) {
      Sentry.captureException(message, { extra: { context: rest } });
    } else if (typeof message === 'string') {
      Sentry.captureMessage(message, 'error');
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
    const [message] = args;
    if (typeof message === 'string') {
      Sentry.captureMessage(message, 'warning');
    }
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
};
