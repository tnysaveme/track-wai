import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { headers } from 'next/headers'
import { redis } from '@/lib/redis'

/**
 * 5 comments per IP per hour.
 * Keyed on ip:trackId so the budget is per-track, not global.
 */
export const commentRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'tw:comment',
})

/**
 * 30 reaction changes per IP per minute.
 * Generous enough for legitimate back-and-forth voting, blocks scripts.
 */
export const reactionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'tw:reaction',
})

/**
 * 5 admin password attempts per IP per 15 minutes.
 * Fixed window — simpler semantics for a brute-force guard.
 */
export const adminRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '15 m'),
  prefix: 'tw:admin',
})

/** Extract the best available client IP from request headers. */
export async function getIp(): Promise<string> {
  const h = await headers()
  // x-forwarded-for may contain a comma-separated list; the first entry is the client
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return h.get('x-real-ip') ?? '127.0.0.1'
}
