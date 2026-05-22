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

jest.mock('@/lib/supabase/server', () => ({
  createAnonClient: jest.fn(),
}))

jest.mock('@/lib/ratelimit', () => ({
  reactionRatelimit: { limit: jest.fn().mockResolvedValue({ success: true }) },
  getIp: jest.fn().mockResolvedValue('127.0.0.1'),
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { likeTrack, unlikeTrack, dislikeTrack, undislikeTrack } from '@/actions/reactions'
import { createAnonClient } from '@/lib/supabase/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

const TRACK_ID = 'track-uuid-123'
let mockRpc: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockRpc = jest.fn()
  ;(createAnonClient as jest.Mock).mockReturnValue({ rpc: mockRpc })
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('likeTrack', () => {
  it('calls increment_likes with the correct track ID', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await likeTrack(TRACK_ID)
    expect(mockRpc).toHaveBeenCalledWith('track_wai_increment_likes', { track_id: TRACK_ID })
  })

  it('returns empty object on success', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    expect(await likeTrack(TRACK_ID)).toEqual({})
  })

  it('returns error when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ error: new Error('RPC error') })
    expect(await likeTrack(TRACK_ID)).toEqual({ error: 'Failed to like track.' })
  })
})

describe('unlikeTrack', () => {
  it('calls decrement_likes with the correct track ID', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await unlikeTrack(TRACK_ID)
    expect(mockRpc).toHaveBeenCalledWith('track_wai_decrement_likes', { track_id: TRACK_ID })
  })

  it('returns empty object on success', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    expect(await unlikeTrack(TRACK_ID)).toEqual({})
  })

  it('returns error when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ error: new Error('RPC error') })
    expect(await unlikeTrack(TRACK_ID)).toEqual({ error: 'Failed to unlike track.' })
  })
})

describe('dislikeTrack', () => {
  it('calls increment_dislikes with the correct track ID', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await dislikeTrack(TRACK_ID)
    expect(mockRpc).toHaveBeenCalledWith('track_wai_increment_dislikes', { track_id: TRACK_ID })
  })

  it('returns empty object on success', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    expect(await dislikeTrack(TRACK_ID)).toEqual({})
  })

  it('returns error when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ error: new Error('RPC error') })
    expect(await dislikeTrack(TRACK_ID)).toEqual({ error: 'Failed to dislike track.' })
  })
})

describe('undislikeTrack', () => {
  it('calls decrement_dislikes with the correct track ID', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await undislikeTrack(TRACK_ID)
    expect(mockRpc).toHaveBeenCalledWith('track_wai_decrement_dislikes', { track_id: TRACK_ID })
  })

  it('returns empty object on success', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    expect(await undislikeTrack(TRACK_ID)).toEqual({})
  })

  it('returns error when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ error: new Error('RPC error') })
    expect(await undislikeTrack(TRACK_ID)).toEqual({ error: 'Failed to remove dislike.' })
  })
})
