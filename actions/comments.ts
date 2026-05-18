'use server'

import { revalidatePath } from 'next/cache'
import { createAnonClient } from '@/lib/supabase/server'
import { commentRatelimit, getIp } from '@/lib/ratelimit'

/** Characters that should never appear in user-submitted text */
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
/** Zero-width / invisible Unicode spacers that can be used to smuggle content */
const ZERO_WIDTH_RE = /[​-‍﻿­⁠]/g

function sanitise(raw: string): string {
  return raw
    .normalize('NFKC') // normalise unicode (e.g. full-width chars → ASCII)
    .replace(ZERO_WIDTH_RE, '') // strip invisible glue characters
    .replace(CONTROL_CHAR_RE, '') // strip non-printable control characters
    .trim()
}

export async function addComment(
  trackId: string,
  authorName: string,
  body: string,
): Promise<{ error?: string }> {
  const cleanName = sanitise(authorName)
  const cleanBody = sanitise(body)

  if (!cleanName || !cleanBody) return { error: 'Name and comment are required.' }
  if (cleanName.length > 100) return { error: 'Name must be 100 characters or fewer.' }
  if (cleanBody.length > 200) return { error: 'Comment must be 200 characters or fewer.' }

  // Rate limit: 5 comments per IP per hour, budgeted per track
  const ip = await getIp()
  const { success } = await commentRatelimit.limit(`${ip}:${trackId}`)
  if (!success) return { error: 'Too many comments. Please wait a while before posting again.' }

  const supabase = createAnonClient()

  // Verify the track exists and is currently active before accepting the comment
  const { data: track, error: trackError } = await supabase
    .from('tracks')
    .select('id')
    .eq('id', trackId)
    .eq('is_active', true)
    .maybeSingle()

  if (trackError || !track) return { error: 'This track is no longer active.' }

  const { error } = await supabase.from('comments').insert({
    track_id: trackId,
    author_name: cleanName,
    body: cleanBody,
  })

  if (error) {
    console.error('[addComment] insert failed:', error)
    return { error: 'Failed to post comment.' }
  }

  revalidatePath('/')
  revalidatePath('/comments')
  return {}
}
