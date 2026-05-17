import 'server-only'
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * React cache() deduplicates calls within a single server-render pass,
 * so every page or layout that calls createServiceClient() shares one
 * Supabase instance per request instead of allocating a new one each time.
 */
export const createServiceClient = cache(() =>
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
)
