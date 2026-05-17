'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function likeTrack(trackId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase.rpc('increment_likes', { track_id: trackId })
  if (error) return { error: 'Failed to like track.' }
  revalidatePath('/')
  return {}
}

export async function unlikeTrack(trackId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase.rpc('decrement_likes', { track_id: trackId })
  if (error) return { error: 'Failed to unlike track.' }
  revalidatePath('/')
  return {}
}

export async function dislikeTrack(trackId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase.rpc('increment_dislikes', { track_id: trackId })
  if (error) return { error: 'Failed to dislike track.' }
  revalidatePath('/')
  return {}
}

export async function undislikeTrack(trackId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase.rpc('decrement_dislikes', { track_id: trackId })
  if (error) return { error: 'Failed to remove dislike.' }
  revalidatePath('/')
  return {}
}
