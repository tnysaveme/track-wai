/**
 * @jest-environment node
 */
import { searchSpotify } from '@/lib/spotify'

const mockToken = { access_token: 'test_token', token_type: 'Bearer', expires_in: 3600 }

const mockTrackSearch = {
  tracks: {
    items: [{ external_urls: { spotify: 'https://open.spotify.com/track/abc123' } }],
  },
}

const mockAlbumSearch = {
  albums: {
    items: [{ external_urls: { spotify: 'https://open.spotify.com/album/xyz789' } }],
  },
}

describe('searchSpotify', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    process.env.SPOTIFY_CLIENT_ID = 'test_id'
    process.env.SPOTIFY_CLIENT_SECRET = 'test_secret'
  })

  it('returns Spotify URL for top track result', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockToken) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTrackSearch) })

    const url = await searchSpotify('Giveon KEEPER', 'track')
    expect(url).toBe('https://open.spotify.com/track/abc123')
  })

  it('returns Spotify URL for top album result', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockToken) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAlbumSearch) })

    const url = await searchSpotify('Giveon Give or Take', 'album')
    expect(url).toBe('https://open.spotify.com/album/xyz789')
  })

  it('returns null when no results found', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockToken) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tracks: { items: [] } }),
      })

    const url = await searchSpotify('nonexistentxyz', 'track')
    expect(url).toBeNull()
  })
})
