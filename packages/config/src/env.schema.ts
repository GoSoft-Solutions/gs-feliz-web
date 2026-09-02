import { z } from 'zod';

/**
 * Treats an empty/whitespace-only environment variable as "not set".
 *
 * This matters because `.env` files and deployment consoles routinely
 * contain placeholder keys with empty values (e.g. `MANYCHAT_API_KEY=`).
 * Without this, an empty value would fail validation instead of falling
 * back to the variable being genuinely absent.
 */
const optionalString = () =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).optional(),
  );

/**
 * Environment variable schema for the FELIZ platform.
 *
 * Only variables required by features implemented TODAY are marked
 * required. Variables for future phases (Stripe, Google, SES, SQS, JWT)
 * are declared as optional so the schema documents them without forcing
 * premature configuration, per the "no future functionality before it's
 * needed" development rule.
 */
export const envSchema = z.object({
  // --- Core runtime ---
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // --- Database ---
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // --- HTTP / security ---
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // --- Integrations: ManyChat (required from Phase 3) ---
  MANYCHAT_API_KEY: optionalString(),

  // --- Future: Payments (Phase 8, not required yet) ---
  STRIPE_SECRET_KEY: optionalString(),
  STRIPE_WEBHOOK_SECRET: optionalString(),

  // --- Future: Google Calendar/Meet (Phase 10, not required yet) ---
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),

  // --- Email delivery (Phase 6 / new subscribe flow) ---
  // EMAIL_PROVIDER selects how welcome emails are delivered:
  //   'log' (default) — logs the rendered email instead of sending it.
  //     Lets the whole capture → send flow run end-to-end while SES is
  //     still in sandbox or the domain is not yet verified.
  //   'ses' — sends for real via AWS SES (requires a verified sender).
  EMAIL_PROVIDER: z.enum(['log', 'ses']).default('log'),
  AWS_REGION: optionalString(),
  SES_FROM_EMAIL: optionalString(),
  // Default sender name shown to recipients when a campaign doesn't set one.
  SES_FROM_NAME: optionalString(),
  // When set, the API publishes subscribe events here and the worker
  // consumes them to send email asynchronously. When empty, the API sends
  // inline (synchronously) — useful for local/demo without SQS.
  SQS_QUEUE_URL: optionalString(),

  // --- Content storage (S3) ---
  // Bucket that holds uploaded content files (PDFs and any other type).
  // When empty, content upload endpoints are disabled (external links
  // still work). Presigned URLs let the browser upload directly to S3.
  CONTENT_BUCKET: optionalString(),
  // How long (seconds) generated upload/download URLs stay valid.
  S3_URL_EXPIRY_SECONDS: z.coerce.number().int().positive().default(3600),

  // --- Unsubscribe ---
  // Public API base URL used to build the unsubscribe link inside emails.
  // The link points to the API's public unsubscribe endpoint.
  PUBLIC_API_URL: z.string().default('https://api.danielcorral.com.mx'),
  // Secret used to sign unsubscribe tokens (HMAC) so a link only works for
  // its intended recipient. Falls back to a static dev value when unset.
  UNSUBSCRIBE_SECRET: z.string().default('feliz-unsubscribe-dev-secret'),

  // --- Future: Auth (Phase 7, not required yet) ---
  JWT_SECRET: optionalString(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates raw environment variables (e.g. process.env) against the schema.
 * Throws a descriptive error on failure so misconfiguration fails fast at
 * boot instead of surfacing as an obscure runtime error later.
 */
export function validateEnv(raw: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}
