'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { searchItunes, type ItunesResult } from '@/lib/itunes'
import { searchSpotify } from '@/lib/spotify'

async function requireAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === 'authenticated'
}

export type SearchTracksResult =
  | { results: ItunesResult[]; error?: never }
  | { results?: never; error: string }

export async function searchTracks(
  query: string,
  type: 'song' | 'album',
): Promise<SearchTracksResult> {
  const trimmed = query.trim().slice(0, 200)
  if (!trimmed) return { error: 'Please enter a search term.' }
  try {
    const results = await searchItunes(trimmed, type)
    if (results.length === 0) return { error: 'No results found — try a different search term.' }
    return { results }
  } catch {
    return { error: 'Search failed. Please try again.' }
  }
}

export async function setActiveTrack(
  itunesResult: ItunesResult,
  itemType: 'song' | 'album',
  query: string,
): Promise<{ error?: string }> {
  if (!(await requireAdminSession())) return { error: 'Unauthorized.' }

  // Validate incoming iTunes result fields
  if (!itunesResult.trackName?.trim() || !itunesResult.artistName?.trim()) {
    return { error: 'Invalid track data.' }
  }
  if (!itunesResult.artworkUrl?.startsWith('https://')) {
    return { error: 'Invalid artwork URL.' }
  }

  const supabase = createServiceClient()
  const spotifyType = itemType === 'song' ? 'track' : 'album'
  const fallbackSpotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${itunesResult.artistName} ${itunesResult.trackName}`)}`

  let spotifyUrl: string
  try {
    spotifyUrl = (await searchSpotify(query, spotifyType)) ?? fallbackSpotifyUrl
  } catch {
    spotifyUrl = fallbackSpotifyUrl
  }

  const { error } = await supabase.rpc('set_active_track', {
    p_item_type: itemType,
    p_spotify_url: spotifyUrl,
    p_apple_music_url: itunesResult.appleMusicUrl ?? null,
    p_itunes_track_name: itunesResult.trackName,
    p_itunes_artist_name: itunesResult.artistName,
    p_itunes_album_art_url: itunesResult.artworkUrl,
    p_itunes_preview_url: itunesResult.previewUrl,
  })

  if (error) return { error: 'Failed to set new track.' }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  return {}
}

export async function deactivateActiveTrack(trackId: string): Promise<{ error?: string }> {
  if (!(await requireAdminSession())) return { error: 'Unauthorized.' }
  if (!trackId?.trim()) return { error: 'Invalid track ID.' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('tracks')
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq('id', trackId)
    .eq('is_active', true)

  if (error) return { error: 'Failed to deactivate track.' }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  return {}
}

export async function deleteTrack(trackId: string): Promise<{ error?: string }> {
  if (!(await requireAdminSession())) return { error: 'Unauthorized.' }
  if (!trackId?.trim()) return { error: 'Invalid track ID.' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('tracks').delete().eq('id', trackId)

  if (error) return { error: 'Failed to delete track.' }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  return {}
}

export async function reactivateTrack(trackId: string): Promise<{ error?: string }> {
  if (!(await requireAdminSession())) return { error: 'Unauthorized.' }
  if (!trackId?.trim()) return { error: 'Invalid track ID.' }

  const supabase = createServiceClient()
  const { error } = await supabase.rpc('reactivate_track', { p_track_id: trackId })

  if (error) return { error: 'Failed to reactivate track.' }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  return {}
}
