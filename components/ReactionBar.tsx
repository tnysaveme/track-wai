'use client'

import { useState, useEffect, useRef, type RefObject } from 'react'
import { Heart, MessageCircle, ThumbsDown } from 'lucide-react'
import { likeTrack, unlikeTrack, dislikeTrack, undislikeTrack } from '@/actions/reactions'
import { supabaseBrowser } from '@/lib/supabase/client'
import NumberDisplay from '@/components/NumberDisplay'
import Link from 'next/link'

type VoteState = 'liked' | 'disliked' | null

type Props = {
  trackId: string
  initialLikes: number
  initialDislikes: number
  commentCount: number
}

const VOTE_KEY = 'trackwai_vote'

export default function ReactionBar({ trackId, initialLikes, initialDislikes, commentCount: initialCommentCount }: Props) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [vote, setVote] = useState<VoteState>(null)
  // True while a user action is in flight — suppresses intermediate realtime events
  const pendingRef = useRef(false)
  const heartRef = useRef<HTMLSpanElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)

  function popIcon(ref: RefObject<HTMLSpanElement | null>, cls: string) {
    const el = ref.current
    if (!el) return
    el.classList.remove(cls)
    void el.offsetHeight
    el.classList.add(cls)
  }

  useEffect(() => {
    const stored = localStorage.getItem(VOTE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { trackId: string; vote: VoteState }
        if (parsed.trackId === trackId) setVote(parsed.vote)
      } catch {
        localStorage.removeItem(VOTE_KEY)
      }
    }
  }, [trackId])

  // Single channel for both reactions (UPDATE on tracks) and comment count
  // (INSERT on comments). Comments lacks REPLICA IDENTITY FULL so server-side
  // filtering on track_id silently drops events; we filter client-side instead.
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`track-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tracks', filter: `id=eq.${trackId}` },
        (payload) => {
          if (pendingRef.current) return
          const updated = payload.new as { likes: number; dislikes: number }
          setLikes(updated.likes)
          setDislikes(updated.dislikes)
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const row = payload.new as { track_id: string }
          if (row.track_id === trackId) setCommentCount((c) => c + 1)
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [trackId])

  function saveVote(newVote: VoteState) {
    setVote(newVote)
    localStorage.setItem(VOTE_KEY, JSON.stringify({ trackId, vote: newVote }))
  }

  function releasePending() {
    // Hold the lock 300 ms after the last action so late-arriving intermediate
    // realtime events (from earlier operations in the same sequence) are discarded
    setTimeout(() => { pendingRef.current = false }, 300)
  }

  async function handleLike() {
    const prevVote = vote
    const prevLikes = likes
    const prevDislikes = dislikes
    pendingRef.current = true

    if (vote === 'liked') {
      // Optimistic
      setLikes((l) => l - 1)
      saveVote(null)
      // Server
      const result = await unlikeTrack(trackId)
      if (result.error) {
        pendingRef.current = false
        setLikes(prevLikes)
        saveVote(prevVote)
      } else {
        releasePending()
      }
    } else {
      popIcon(heartRef, 'heart-pop')
      // Optimistic — all updates before any await
      if (vote === 'disliked') setDislikes((d) => d - 1)
      setLikes((l) => l + 1)
      saveVote('liked')
      // Server
      if (vote === 'disliked') {
        const undislikeResult = await undislikeTrack(trackId)
        if (undislikeResult.error) {
          pendingRef.current = false
          setLikes(prevLikes)
          setDislikes(prevDislikes)
          saveVote(prevVote)
          return
        }
      }
      const result = await likeTrack(trackId)
      if (result.error) {
        pendingRef.current = false
        setLikes(prevLikes)
        setDislikes(prevDislikes)
        saveVote(prevVote)
      } else {
        releasePending()
      }
    }
  }

  async function handleDislike() {
    const prevVote = vote
    const prevLikes = likes
    const prevDislikes = dislikes
    pendingRef.current = true

    if (vote === 'disliked') {
      // Optimistic
      setDislikes((d) => d - 1)
      saveVote(null)
      // Server
      const result = await undislikeTrack(trackId)
      if (result.error) {
        pendingRef.current = false
        setDislikes(prevDislikes)
        saveVote(prevVote)
      } else {
        releasePending()
      }
    } else {
      popIcon(thumbRef, 'thumb-pop')
      // Optimistic — all updates before any await
      if (vote === 'liked') setLikes((l) => l - 1)
      setDislikes((d) => d + 1)
      saveVote('disliked')
      // Server
      if (vote === 'liked') {
        const unlikeResult = await unlikeTrack(trackId)
        if (unlikeResult.error) {
          pendingRef.current = false
          setLikes(prevLikes)
          setDislikes(prevDislikes)
          saveVote(prevVote)
          return
        }
      }
      const result = await dislikeTrack(trackId)
      if (result.error) {
        pendingRef.current = false
        setLikes(prevLikes)
        setDislikes(prevDislikes)
        saveVote(prevVote)
      } else {
        releasePending()
      }
    }
  }

  return (
    <div className="flex gap-8 sm:gap-12 items-start">
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1 p-2 transition duration-150 ease-out active:scale-90 hov:opacity-70"
        aria-label="Like"
        aria-pressed={vote === 'liked'}
      >
        <span ref={heartRef} className="inline-flex">
          <Heart size={24} fill={vote === 'liked' ? 'red' : 'none'} stroke={vote === 'liked' ? 'red' : 'currentColor'} strokeWidth={vote === 'liked' ? 0 : 2} />
        </span>
        <NumberDisplay value={likes} className="text-sm" />
      </button>

      <Link href="/comments" className="flex flex-col items-center gap-1 p-2 transition-opacity hover:opacity-60" aria-label="Comments">
        <MessageCircle size={24} />
        <NumberDisplay value={commentCount} className="text-sm" />
      </Link>

      <button
        onClick={handleDislike}
        className="flex flex-col items-center gap-1 p-2 transition duration-150 ease-out active:scale-90 hov:opacity-70"
        aria-label="Dislike"
        aria-pressed={vote === 'disliked'}
      >
        <span ref={thumbRef} className="inline-flex">
          <ThumbsDown size={24} fill={vote === 'disliked' ? 'black' : 'none'} strokeWidth={vote === 'disliked' ? 0 : 2} />
        </span>
        <NumberDisplay value={dislikes} className="text-sm" />
      </button>
    </div>
  )
}
