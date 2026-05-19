export const dynamic = 'force-dynamic'

import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import AddCommentModal from '@/components/AddCommentModal'
import CommentsList from '@/components/CommentsList'
import RealtimeTrackRefresh from '@/components/RealtimeTrackRefresh'
import Link from 'next/link'

export default async function CommentsPage() {
  const supabase = createServiceClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('id')
    .eq('is_active', true)
    .single()

  const initialComments = track
    ? ((
        await supabase
          .from('comments')
          .select('id, author_name, body, created_at')
          .eq('track_id', track.id)
          .order('created_at', { ascending: false })
      ).data ?? [])
    : []

  return (
    <main className="min-h-screen bg-background p-8">
      <RealtimeTrackRefresh />
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-xl font-bold">Comments</h1>
        <Link href="/" aria-label="Back to home" className="p-2 -mr-2 transition-opacity hover:opacity-60">
          <ArrowLeft size={20} />
        </Link>
      </div>

      {track ? (
        <>
          <CommentsList key={track.id} trackId={track.id} initialComments={initialComments} />
          <AddCommentModal key={track.id} trackId={track.id} />
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Whatcha say?</p>
        </div>
      )}
    </main>
  )
}
