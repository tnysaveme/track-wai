import 'server-only'

async function getAccessToken(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set')

  const credentials = Buffer.from(`${id}:${secret}`).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`)
  const data: { access_token: string } = await res.json()
  return data.access_token
}

export async function searchSpotify(
  query: string,
  type: 'track' | 'album',
): Promise<string | null> {
  const token = await getAccessToken()
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=1`

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Spotify search error: ${res.status}`)

  type SpotifyItem = { external_urls: { spotify: string } }

  const data: {
    tracks?: { items: SpotifyItem[] }
    albums?: { items: SpotifyItem[] }
  } = await res.json()

  const items = type === 'track' ? data.tracks?.items : data.albums?.items

  if (!items || items.length === 0) return null
  return items[0].external_urls.spotify
}
