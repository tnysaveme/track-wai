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

export async function searchItunes(
  query: string,
  entity: 'song' | 'album',
): Promise<ItunesResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=5`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`)

  const data: { results: ItunesRawResult[] } = await res.json()

  return data.results.map((r) => ({
    stableId: String(r.trackId ?? r.collectionId ?? r.artworkUrl100),
    trackName: r.trackName ?? r.collectionName ?? '',
    artistName: r.artistName,
    // iTunes artwork URLs use the pattern `100x100bb` — replace with 600x600 for high-res
    artworkUrl: r.artworkUrl100.replace('100x100bb', '600x600bb'),
    previewUrl: r.previewUrl ?? null,
    collectionName: r.collectionName ?? '',
    appleMusicUrl: r.trackViewUrl ?? r.collectionViewUrl ?? null,
  }))
}
