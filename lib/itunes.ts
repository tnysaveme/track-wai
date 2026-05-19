import 'server-only'

export type ItunesResult = {
  stableId: string
  trackName: string
  artistName: string
  artworkUrl: string
  previewUrl: string | null
  collectionName: string
  appleMusicUrl: string | null
}

type ItunesRawResult = {
  trackId?: number
  collectionId?: number
  trackName?: string
  collectionName?: string
  artistName: string
  artworkUrl100: string
  previewUrl?: string
  trackViewUrl?: string
  collectionViewUrl?: string
}

function mapRawResult(r: ItunesRawResult): ItunesResult {
  return {
    stableId: String(r.trackId ?? r.collectionId ?? r.artworkUrl100),
    trackName: r.trackName ?? r.collectionName ?? '',
    artistName: r.artistName,
    // iTunes artwork URLs use the pattern `100x100bb` — replace with 600x600 for high-res
    artworkUrl: r.artworkUrl100.replace('100x100bb', '600x600bb'),
    previewUrl: r.previewUrl ?? null,
    collectionName: r.collectionName ?? '',
    appleMusicUrl: r.trackViewUrl ?? r.collectionViewUrl ?? null,
  }
}

export async function searchItunes(
  query: string,
  entity: 'song' | 'album',
  limit = 10,
): Promise<ItunesResult[]> {
  // iTunes caps limit at 200; we cap at 50 to keep responses snappy
  const safeLimit = Math.min(Math.max(limit, 1), 50)
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=${safeLimit}`
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`)

  const data: { results: ItunesRawResult[] } = await res.json()
  return data.results.map(mapRawResult)
}

/**
 * Parse an Apple Music URL into the iTunes-lookup parameters.
 *
 * Apple Music URL forms:
 *   album:  https://music.apple.com/{country}/album/{slug}/{collectionId}
 *   song:   https://music.apple.com/{country}/album/{slug}/{collectionId}?i={trackId}
 *   song:   https://music.apple.com/{country}/song/{slug}/{trackId}
 */
export function parseAppleMusicUrl(
  input: string,
): { id: string; entity: 'song' | 'album' } | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (!url.hostname.endsWith('music.apple.com') && !url.hostname.endsWith('apple.co')) {
    return null
  }

  // Song URL with ?i=<trackId> takes precedence
  const songId = url.searchParams.get('i')
  if (songId && /^\d+$/.test(songId)) {
    return { id: songId, entity: 'song' }
  }

  const segments = url.pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  if (!lastSegment || !/^\d+$/.test(lastSegment)) return null

  // /song/.../<trackId> = song; /album/.../<collectionId> = album
  const entity: 'song' | 'album' = segments.includes('song') ? 'song' : 'album'
  return { id: lastSegment, entity }
}

/** Look up a single iTunes record by its numeric ID. */
export async function lookupItunes(
  id: string,
  entity: 'song' | 'album',
): Promise<ItunesResult | null> {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`iTunes lookup error: ${res.status}`)

  const data: { results: ItunesRawResult[] } = await res.json()
  // Match strictly on the requested entity's ID to avoid pulling a parent
  // album's record when we asked for a song or vice versa
  const match = data.results.find((r) =>
    entity === 'song' ? String(r.trackId) === id : String(r.collectionId) === id,
  )
  return match ? mapRawResult(match) : null
}
