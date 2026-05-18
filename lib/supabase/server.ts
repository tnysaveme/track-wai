import 'server-only'
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Anon client — respects Row Level Security.
 * Use this for all public-facing server actions (comments, reactions).
 * React cache() deduplicates calls within a single server-render pass.
 */
export const createAnonClient = cache(() =>
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
)

/**
 * Service-role client — bypasses Row Level Security.
 * Use this ONLY for admin actions that genuinely need elevated access
 * (reading inactive tracks, setting/deleting tracks, etc.).
 */
export const createServiceClient = cache(() =>
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
)
