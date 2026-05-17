import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import AddCommentModal from '@/components/AddCommentModal'
import CommentsList from '@/components/CommentsList'
import TransitionLink from '@/components/TransitionLink'

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
    <main className="min-h-screen bg-white p-8">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-xl font-bold">Comments</h1>
        <TransitionLink href="/" aria-label="Back to home" className="transition-opacity hover:opacity-60">
          <ArrowLeft size={20} />
        </TransitionLink>
      </div>

      {track ? (
        <>
          <CommentsList trackId={track.id} initialComments={initialComments} />
          <AddCommentModal trackId={track.id} />
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Whatcha say?</p>
        </div>
      )}
    </main>
  )
}
