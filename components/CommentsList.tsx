'use client'

import { useState, useEffect, useRef } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

type Comment = {
  id: string
  author_name: string
  body: string
  created_at: string
}

type Props = {
  trackId: string
  initialComments: Comment[]
}

export default function CommentsList({ trackId, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  // IDs that were present on mount — they don't animate in
  const initialIds = useRef(new Set(initialComments.map((c) => c.id)))

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`comments-list-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `track_id=eq.${trackId}` },
        (payload) => {
          const newComment = payload.new as Comment
          setComments((prev) => [newComment, ...prev])
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [trackId])

  if (comments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Whatcha say?</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg ml-[15%]">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className={initialIds.current.has(comment.id) ? '' : 'comment-new'}
        >
          <p className="text-sm font-bold">{comment.author_name}</p>
          <p className="text-base mt-0.5">{comment.body}</p>
        </div>
      ))}
    </div>
  )
}
