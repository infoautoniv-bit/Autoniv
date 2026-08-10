import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  FRONTEND_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  CSRF_SECRET: z.string().min(16, 'CSRF_SECRET must be at least 16 characters'),
  VAPI_API_KEY: z.string().min(1, 'VAPI_API_KEY is required'),
  SENTRY_DSN: z.string().url().optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.format();
    const missing = Object.entries(formatted)
      .filter(function ([, v]) {
        return v && typeof v === 'object' && '_errors' in v && v._errors.length > 0;
      })
      .map(function ([k, v]) {
        return '  ' + k + ': ' + v._errors.join(', ');
      })
      .join('\n');
    console.error('\n❌ Environment validation failed:\n' + missing + '\n');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.warn('⚠️  Continuing in development mode with invalid env vars.\n');
  }
  return parsed.success ? parsed.data : {};
}
