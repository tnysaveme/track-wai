/**
 * @jest-environment node
 */
import { searchItunes, type ItunesResult } from '@/lib/itunes'

const mockSongResponse = {
  results: [
    {
      wrapperType: 'track',
      trackName: 'KEEPER (feat. Teddy Swims)',
      artistName: 'Giveon',
      collectionName: 'Give or Take',
      artworkUrl100: 'https://example.com/100x100bb.jpg',
      previewUrl: 'https://example.com/preview.mp3',
    },
  ],
}

const mockAlbumResponse = {
  results: [
    {
      wrapperType: 'collection',
      collectionName: 'Give or Take',
      artistName: 'Giveon',
      artworkUrl100: 'https://example.com/100x100bb.jpg',
    },
  ],
}

describe('searchItunes', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('returns formatted song results with high-res art URL', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSongResponse),
    })

    const results = await searchItunes('Giveon KEEPER', 'song')

    expect(results).toHaveLength(1)
    expect(results[0].trackName).toBe('KEEPER (feat. Teddy Swims)')
    expect(results[0].artistName).toBe('Giveon')
    expect(results[0].artworkUrl).toBe('https://example.com/600x600bb.jpg')
    expect(results[0].previewUrl).toBe('https://example.com/preview.mp3')
  })

  it('returns album results with null previewUrl', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAlbumResponse),
    })

    const results = await searchItunes('Giveon Give or Take', 'album')

    expect(results[0].previewUrl).toBeNull()
    expect(results[0].trackName).toBe('Give or Take')
  })

  it('returns empty array when no results', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    })

    const results = await searchItunes('nonexistentxyz', 'song')
    expect(results).toHaveLength(0)
  })

  it('throws when the API returns a non-ok response', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(searchItunes('Giveon', 'song')).rejects.toThrow('iTunes API error')
  })
})
