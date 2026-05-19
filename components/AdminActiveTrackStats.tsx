'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, ThumbsDown } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'

type Props = {
  trackId: string
  initialLikes: number
  initialDislikes: number
  initialCommentCount: number
}

export default function AdminActiveTrackStats({
  trackId,
  initialLikes,
  initialDislikes,
  initialCommentCount,
}: Props) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [commentCount, setCommentCount] = useState(initialCommentCount)

  // Resync local state whenever the active track changes. Without this the
  // useState seeds stay frozen at the previous track's counts on a server
  // re-render. We don't use `key` here because adding it caused a duplicated
  // DOM node in practice — likely a Next.js refresh race between the server
  // action's revalidatePath and the realtime router.refresh() running
  // concurrently against a remounting subtree.
  useEffect(() => {
    setLikes(initialLikes)
    setDislikes(initialDislikes)
    setCommentCount(initialCommentCount)
  }, [trackId, initialLikes, initialDislikes, initialCommentCount])

  // Single channel for reactions (UPDATE on tracks) and comment count (INSERT on
  // comments). Comments lacks REPLICA IDENTITY FULL so the server-side track_id
  // filter silently drops events; we filter client-side instead.
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`admin-track-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tracks', filter: `id=eq.${trackId}` },
        (payload) => {
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

  return (
    <div className="mt-4 flex items-center gap-6 text-sm">
      <span className="flex items-center gap-1.5 text-gray-600">
        <Heart size={14} className="shrink-0" />
        <span className="font-bold text-black tabular-nums">{likes}</span>
        <span className="text-gray-400">likes</span>
      </span>
      <span className="flex items-center gap-1.5 text-gray-600">
        <ThumbsDown size={14} className="shrink-0" />
        <span className="font-bold text-black tabular-nums">{dislikes}</span>
        <span className="text-gray-400">dislikes</span>
      </span>
      <span className="flex items-center gap-1.5 text-gray-600">
        <MessageCircle size={14} className="shrink-0" />
        <span className="font-bold text-black tabular-nums">{commentCount}</span>
        <span className="text-gray-400">comments</span>
      </span>
    </div>
  )
}
