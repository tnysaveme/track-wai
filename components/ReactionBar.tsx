'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { likeTrack, unlikeTrack, dislikeTrack, undislikeTrack } from '@/actions/reactions'

type VoteState = 'liked' | 'disliked' | null

type Props = {
  trackId: string
  initialLikes: number
  initialDislikes: number
  commentCount: number
}

const VOTE_KEY = 'trackwai_vote'

export default function ReactionBar({ trackId, initialLikes, initialDislikes, commentCount }: Props) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [vote, setVote] = useState<VoteState>(null)

  useEffect(() => {
    setLikes(initialLikes)
    setDislikes(initialDislikes)
  }, [initialLikes, initialDislikes])

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

  function saveVote(newVote: VoteState) {
    setVote(newVote)
    localStorage.setItem(VOTE_KEY, JSON.stringify({ trackId, vote: newVote }))
  }

  async function handleLike() {
    const prevVote = vote
    const prevLikes = likes
    const prevDislikes = dislikes

    if (vote === 'liked') {
      setLikes((l) => l - 1)
      saveVote(null)
      const result = await unlikeTrack(trackId)
      if (result.error) {
        setLikes(prevLikes)
        saveVote(prevVote)
      }
    } else {
      if (vote === 'disliked') {
        setDislikes((d) => d - 1)
        const undislikeResult = await undislikeTrack(trackId)
        if (undislikeResult.error) {
          setDislikes(prevDislikes)
          return
        }
      }
      setLikes((l) => l + 1)
      saveVote('liked')
      const result = await likeTrack(trackId)
      if (result.error) {
        setLikes(prevLikes)
        setDislikes(prevDislikes)
        saveVote(prevVote)
      }
    }
  }

  async function handleDislike() {
    const prevVote = vote
    const prevLikes = likes
    const prevDislikes = dislikes

    if (vote === 'disliked') {
      setDislikes((d) => d - 1)
      saveVote(null)
      const result = await undislikeTrack(trackId)
      if (result.error) {
        setDislikes(prevDislikes)
        saveVote(prevVote)
      }
    } else {
      if (vote === 'liked') {
        setLikes((l) => l - 1)
        const unlikeResult = await unlikeTrack(trackId)
        if (unlikeResult.error) {
          setLikes(prevLikes)
          return
        }
      }
      setDislikes((d) => d + 1)
      saveVote('disliked')
      const result = await dislikeTrack(trackId)
      if (result.error) {
        setLikes(prevLikes)
        setDislikes(prevDislikes)
        saveVote(prevVote)
      }
    }
  }

  return (
    <div className="flex gap-12 items-start">
      <button onClick={handleLike} className="flex flex-col items-center gap-1" aria-label="Like">
        <Heart size={24} fill={vote === 'liked' ? 'red' : 'none'} stroke={vote === 'liked' ? 'red' : 'currentColor'} strokeWidth={vote === 'liked' ? 0 : 2} />
        <span className="text-sm">{likes}</span>
      </button>

      <Link href="/comments" className="flex flex-col items-center gap-1" aria-label="Comments">
        <MessageCircle size={24} />
        <span className="text-sm">{commentCount}</span>
      </Link>

      <button onClick={handleDislike} className="flex flex-col items-center gap-1" aria-label="Dislike">
        <ThumbsDown size={24} fill={vote === 'disliked' ? 'black' : 'none'} strokeWidth={vote === 'disliked' ? 0 : 2} />
        <span className="text-sm">{dislikes}</span>
      </button>
    </div>
  )
}
