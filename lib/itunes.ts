export type ItunesResult = {
  trackName: string
  artistName: string
  artworkUrl: string
  previewUrl: string | null
  collectionName: string
}

type ItunesRawResult = {
  wrapperType: string
  trackName?: string
  collectionName?: string
  artistName: string
  artworkUrl100: string
  previewUrl?: string
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
    trackName: r.trackName ?? r.collectionName ?? '',
    artistName: r.artistName,
    artworkUrl: r.artworkUrl100.replace('100x100bb', '600x600bb'),
    previewUrl: r.previewUrl ?? null,
    collectionName: r.collectionName ?? '',
  }))
}
