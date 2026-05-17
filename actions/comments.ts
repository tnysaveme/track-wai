'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function addComment(
  trackId: string,
  authorName: string,
  body: string,
): Promise<{ error?: string }> {
  if (!authorName.trim() || !body.trim()) return { error: 'Name and comment are required.' }
  if (authorName.trim().length > 100) return { error: 'Name must be 100 characters or fewer.' }
  if (body.trim().length > 200) return { error: 'Comment must be 200 characters or fewer.' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('comments').insert({
    track_id: trackId,
    author_name: authorName.trim(),
    body: body.trim(),
  })

  if (error) return { error: 'Failed to post comment.' }

  revalidatePath('/')
  revalidatePath('/comments')
  return {}
}
