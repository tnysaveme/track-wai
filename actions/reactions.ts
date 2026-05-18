'use server'

import { createAnonClient } from '@/lib/supabase/server'
import { reactionRatelimit, getIp } from '@/lib/ratelimit'

// Note: we intentionally do NOT call revalidatePath() here.
// Reaction counts (likes/dislikes) are kept live via the Realtime subscription
// in ReactionBar — adding server revalidation on every vote would trigger a
// full page re-render for every visitor on every click, which is wasteful and
// conflicts with the Realtime updates already in flight.

async function checkReactionRateLimit(): Promise<{ error: string } | null> {
  const ip = await getIp()
  const { success } = await reactionRatelimit.limit(ip)
  if (!success) return { error: 'Too many reactions. Please slow down.' }
  return null
}

export async function likeTrack(trackId: string): Promise<{ error?: string }> {
  const limited = await checkReactionRateLimit()
  if (limited) return limited

  const supabase = createAnonClient()
  const { error } = await supabase.rpc('increment_likes', { track_id: trackId })
  if (error) {
    console.error('[likeTrack] rpc failed:', error)
    return { error: 'Failed to like track.' }
  }
  return {}
}

export async function unlikeTrack(trackId: string): Promise<{ error?: string }> {
  const limited = await checkReactionRateLimit()
  if (limited) return limited

  const supabase = createAnonClient()
  const { error } = await supabase.rpc('decrement_likes', { track_id: trackId })
  if (error) {
    console.error('[unlikeTrack] rpc failed:', error)
    return { error: 'Failed to unlike track.' }
  }
  return {}
}

export async function dislikeTrack(trackId: string): Promise<{ error?: string }> {
  const limited = await checkReactionRateLimit()
  if (limited) return limited

  const supabase = createAnonClient()
  const { error } = await supabase.rpc('increment_dislikes', { track_id: trackId })
  if (error) {
    console.error('[dislikeTrack] rpc failed:', error)
    return { error: 'Failed to dislike track.' }
  }
  return {}
}

export async function undislikeTrack(trackId: string): Promise<{ error?: string }> {
  const limited = await checkReactionRateLimit()
  if (limited) return limited

  const supabase = createAnonClient()
  const { error } = await supabase.rpc('decrement_dislikes', { track_id: trackId })
  if (error) {
    console.error('[undislikeTrack] rpc failed:', error)
    return { error: 'Failed to remove dislike.' }
  }
  return {}
}
