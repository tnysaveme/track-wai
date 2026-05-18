import 'server-only'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Check your .env.local file or deployment environment.',
    )
  }
  return value
}

/**
 * Validated server-side environment variables.
 * Throws at module-load time if any required variable is missing,
 * so the error surfaces immediately rather than at the call site.
 */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  ADMIN_PASSWORD: requireEnv('ADMIN_PASSWORD'),
  UPSTASH_REDIS_REST_URL: requireEnv('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
} as const
