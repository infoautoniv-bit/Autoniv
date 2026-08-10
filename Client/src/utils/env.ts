import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_FACEBOOK_APP_ID: z.string().optional(),
  VITE_FACEBOOK_CONFIG_ID: z.string().optional(),
  VITE_VAPI_API_KEY: z.string().optional(),
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')).default(''),
  VITE_GA_ID: z.string().optional(),
  VITE_CLARITY_ID: z.string().optional(),
  VITE_CONTACT_EMAIL: z.string().email().optional(),
  VITE_CONTACT_PHONE: z.string().optional(),
  VITE_CONTACT_PHONE_RAW: z.string().optional(),
  VITE_CONTACT_WEBSITE: z.string().url().optional(),
});

export function validateEnv() {
  const raw: Record<string, string | undefined> = {};
  for (const key of Object.keys(envSchema.shape)) {
    raw[key] = import.meta.env[key];
  }

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.format();
    const missing = Object.entries(errors)
      .filter(([, v]) => v && typeof v === 'object' && '_errors' in v && v._errors.length > 0)
      .map(([k, v]) => `${k}: ${(v as { _errors: string[] })._errors.join(', ')}`)
      .join('\n  ');
    console.warn(`⚠️  Environment validation warnings:\n  ${missing}`);
  }

  // In production, fail if VITE_API_URL is not set
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    throw new Error('VITE_API_URL must be set in production builds');
  }

  return parsed.success ? parsed.data : {};
}
