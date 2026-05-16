import 'server-only'

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64')

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

  const data = await res.json()
  const items: { external_urls: { spotify: string } }[] =
    type === 'track' ? data.tracks?.items : data.albums?.items

  if (!items || items.length === 0) return null
  return items[0].external_urls.spotify
}
