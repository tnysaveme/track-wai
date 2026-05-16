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
      const parsed = JSON.parse(stored) as { trackId: string; vote: VoteState }
      if (parsed.trackId === trackId) setVote(parsed.vote)
    }
  }, [trackId])

  function saveVote(newVote: VoteState) {
    setVote(newVote)
    localStorage.setItem(VOTE_KEY, JSON.stringify({ trackId, vote: newVote }))
  }

  async function handleLike() {
    if (vote === 'liked') {
      setLikes((l) => l - 1)
      saveVote(null)
      await unlikeTrack(trackId)
    } else {
      if (vote === 'disliked') {
        setDislikes((d) => d - 1)
        await undislikeTrack(trackId)
      }
      setLikes((l) => l + 1)
      saveVote('liked')
      await likeTrack(trackId)
    }
  }

  async function handleDislike() {
    if (vote === 'disliked') {
      setDislikes((d) => d - 1)
      saveVote(null)
      await undislikeTrack(trackId)
    } else {
      if (vote === 'liked') {
        setLikes((l) => l - 1)
        await unlikeTrack(trackId)
      }
      setDislikes((d) => d + 1)
      saveVote('disliked')
      await dislikeTrack(trackId)
    }
  }

  return (
    <div className="flex gap-12 items-start">
      <button onClick={handleLike} className="flex flex-col items-center gap-1" aria-label="Like">
        <Heart size={24} fill={vote === 'liked' ? 'black' : 'none'} strokeWidth={vote === 'liked' ? 0 : 2} />
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
