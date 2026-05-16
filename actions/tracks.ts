'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { searchItunes, type ItunesResult } from '@/lib/itunes'
import { searchSpotify } from '@/lib/spotify'

export type SearchTracksResult =
  | { results: ItunesResult[]; error?: never }
  | { results?: never; error: string }

export async function searchTracks(
  query: string,
  type: 'song' | 'album',
): Promise<SearchTracksResult> {
  try {
    const results = await searchItunes(query, type)
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
  const supabase = createServiceClient()
  const spotifyType = itemType === 'song' ? 'track' : 'album'

  let spotifyUrl: string
  try {
    spotifyUrl =
      (await searchSpotify(query, spotifyType)) ??
      `https://open.spotify.com/search/${encodeURIComponent(query)}`
  } catch {
    spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`
  }

  const now = new Date().toISOString()

  const { error: deactivateError } = await supabase
    .from('tracks')
    .update({ is_active: false, deactivated_at: now })
    .eq('is_active', true)

  if (deactivateError) return { error: 'Failed to update current track.' }

  const { error: insertError } = await supabase.from('tracks').insert({
    item_type: itemType,
    is_active: true,
    spotify_url: spotifyUrl,
    itunes_track_name: itunesResult.trackName,
    itunes_artist_name: itunesResult.artistName,
    itunes_album_art_url: itunesResult.artworkUrl,
    itunes_preview_url: itunesResult.previewUrl,
  })

  if (insertError) return { error: 'Failed to set new track.' }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  return {}
}

export async function reactivateTrack(trackId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { error: deactivateError } = await supabase
    .from('tracks')
    .update({ is_active: false, deactivated_at: now })
    .eq('is_active', true)

  if (deactivateError) return { error: 'Failed to deactivate current track.' }

  const { error: reactivateError } = await supabase
    .from('tracks')
    .update({ is_active: true, deactivated_at: null })
    .eq('id', trackId)

  if (reactivateError) return { error: 'Failed to reactivate track.' }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  return {}
}
