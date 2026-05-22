/**
 * @jest-environment node
 */

// ── Module mocks (hoisted before imports) ───────────────────────────────────

jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    ADMIN_PASSWORD: 'test-password',
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createAnonClient: jest.fn(),
}))

jest.mock('@/lib/ratelimit', () => ({
  commentRatelimit: { limit: jest.fn().mockResolvedValue({ success: true }) },
  getIp: jest.fn().mockResolvedValue('127.0.0.1'),
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { addComment } from '@/actions/comments'
import { createAnonClient } from '@/lib/supabase/server'
import { commentRatelimit } from '@/lib/ratelimit'

// ── Helpers ──────────────────────────────────────────────────────────────────

const TRACK_ID = 'track-uuid-123'

let mockMaybeSingle: jest.Mock
let mockInsert: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockMaybeSingle = jest.fn()
  mockInsert = jest.fn()

  // Build a chainable builder for the tracks table
  const tracksBuilder: Record<string, unknown> = {}
  tracksBuilder.select = () => tracksBuilder
  tracksBuilder.eq = () => tracksBuilder
  tracksBuilder.maybeSingle = mockMaybeSingle

  ;(createAnonClient as jest.Mock).mockReturnValue({
    from: (table: string) =>
      table === 'track_wai_tracks' ? tracksBuilder : { insert: mockInsert },
  })
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('addComment — rate limiting', () => {
  it('returns error when rate limit is exceeded', async () => {
    ;(commentRatelimit.limit as jest.Mock).mockResolvedValueOnce({ success: false })
    const result = await addComment(TRACK_ID, 'Alice', 'Great song!')
    expect(result.error).toMatch(/Too many comments/)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

describe('addComment — input validation', () => {
  it('returns error when name is empty', async () => {
    const result = await addComment(TRACK_ID, '', 'Great song!')
    expect(result).toEqual({ error: 'Name and comment are required.' })
  })

  it('returns error when name is only whitespace', async () => {
    const result = await addComment(TRACK_ID, '   ', 'Great song!')
    expect(result).toEqual({ error: 'Name and comment are required.' })
  })

  it('returns error when body is empty', async () => {
    const result = await addComment(TRACK_ID, 'Alice', '')
    expect(result).toEqual({ error: 'Name and comment are required.' })
  })

  it('returns error when name exceeds 100 characters', async () => {
    const result = await addComment(TRACK_ID, 'A'.repeat(101), 'Great song!')
    expect(result.error).toMatch(/100/)
  })

  it('returns error when body exceeds 200 characters', async () => {
    const result = await addComment(TRACK_ID, 'Alice', 'A'.repeat(201))
    expect(result.error).toMatch(/200/)
  })
})

describe('addComment — unicode / sanitisation', () => {
  it('strips zero-width space from body', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: TRACK_ID }, error: null })
    mockInsert.mockResolvedValueOnce({ error: null })

    await addComment(TRACK_ID, 'Alice', 'Great​song!')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'Greatsong!' }),
    )
  })

  it('strips control characters from body', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: TRACK_ID }, error: null })
    mockInsert.mockResolvedValueOnce({ error: null })

    // \x07 is the BEL control character
    await addComment(TRACK_ID, 'Alice', 'Hello\x07World')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'HelloWorld' }),
    )
  })

  it('normalises NFKC unicode in name', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: TRACK_ID }, error: null })
    mockInsert.mockResolvedValueOnce({ error: null })

    // Ａｌｉｃｅ — full-width latin letters
    await addComment(TRACK_ID, 'Ａｌｉｃｅ', 'Nice')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ author_name: 'Alice' }),
    )
  })
})

describe('addComment — track existence check', () => {
  it('returns error when track is not found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await addComment(TRACK_ID, 'Alice', 'Great song!')
    expect(result).toEqual({ error: 'This track is no longer active.' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns error when track lookup returns a DB error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB error') })

    const result = await addComment(TRACK_ID, 'Alice', 'Great song!')
    expect(result).toEqual({ error: 'This track is no longer active.' })
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

describe('addComment — insert', () => {
  it('returns error when insert fails', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: TRACK_ID }, error: null })
    mockInsert.mockResolvedValueOnce({ error: new Error('Insert failed') })

    const result = await addComment(TRACK_ID, 'Alice', 'Great song!')
    expect(result).toEqual({ error: 'Failed to post comment.' })
  })

  it('returns empty object on success', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: TRACK_ID }, error: null })
    mockInsert.mockResolvedValueOnce({ error: null })

    const result = await addComment(TRACK_ID, 'Alice', 'Great song!')
    expect(result).toEqual({})
  })

  it('trims surrounding whitespace before storing', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: TRACK_ID }, error: null })
    mockInsert.mockResolvedValueOnce({ error: null })

    await addComment(TRACK_ID, '  Alice  ', '  Great!  ')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ author_name: 'Alice', body: 'Great!' }),
    )
  })
})
