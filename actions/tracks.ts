'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { searchItunes, type ItunesResult } from '@/lib/itunes'
import { searchSpotify } from '@/lib/spotify'
import { verifyAdminSession } from '@/actions/admin'

async function signalTrackChange(eventType: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('track_events').insert({ event_type: eventType })
  if (error) {
    console.error('[signalTrackChange] insert failed — realtime signal not sent:', error)
    return
  }
  // Prune signals older than 1 hour — they're just notification triggers
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  await supabase.from('track_events').delete().lt('created_at', cutoff)
}

export type SearchTracksResult =
  | { results: ItunesResult[]; error?: never }
  | { results?: never; error: string }

export async function searchTracks(
  query: string,
  type: 'song' | 'album',
  limit?: number,
): Promise<SearchTracksResult> {
  const trimmed = query.trim().slice(0, 200)
  if (!trimmed) return { error: 'Please enter a search term.' }
  try {
    const results = await searchItunes(trimmed, type, limit)
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
  if (!(await verifyAdminSession())) return { error: 'Unauthorized.' }

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
  } catch (spotifyErr) {
    console.error('[setActiveTrack] Spotify search failed, using fallback URL:', spotifyErr)
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

  if (error) {
    console.error('[setActiveTrack] rpc failed:', error)
    return { error: 'Failed to set new track.' }
  }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  await signalTrackChange('set_active')
  return {}
}

export async function deactivateActiveTrack(trackId: string): Promise<{ error?: string }> {
  if (!(await verifyAdminSession())) return { error: 'Unauthorized.' }
  if (!trackId?.trim()) return { error: 'Invalid track ID.' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('tracks')
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq('id', trackId)
    .eq('is_active', true)

  if (error) {
    console.error('[deactivateActiveTrack] update failed:', error)
    return { error: 'Failed to deactivate track.' }
  }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  await signalTrackChange('deactivate')
  return {}
}

export async function deleteTrack(trackId: string): Promise<{ error?: string }> {
  if (!(await verifyAdminSession())) return { error: 'Unauthorized.' }
  if (!trackId?.trim()) return { error: 'Invalid track ID.' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('tracks').delete().eq('id', trackId)

  if (error) {
    console.error('[deleteTrack] delete failed:', error)
    return { error: 'Failed to delete track.' }
  }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  await signalTrackChange('delete')
  return {}
}

export async function reactivateTrack(trackId: string): Promise<{ error?: string }> {
  if (!(await verifyAdminSession())) return { error: 'Unauthorized.' }
  if (!trackId?.trim()) return { error: 'Invalid track ID.' }

  const supabase = createServiceClient()
  const { error } = await supabase.rpc('reactivate_track', { p_track_id: trackId })

  if (error) {
    console.error('[reactivateTrack] rpc failed:', error)
    return { error: 'Failed to reactivate track.' }
  }

  revalidatePath('/')
  revalidatePath('/comments')
  revalidatePath('/backstage')
  await signalTrackChange('reactivate')
  return {}
}
