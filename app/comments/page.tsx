import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import AddCommentModal from '@/components/AddCommentModal'

export default async function CommentsPage() {
  const supabase = createServiceClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('id')
    .eq('is_active', true)
    .single()

  const comments = track
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
      <div className="flex items-center gap-3 mb-10">
        <Link href="/" aria-label="Back to home">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Comments</h1>
      </div>

      {comments.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Whatcha say?</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-lg">
          {comments.map((comment) => (
            <div key={comment.id}>
              <p className="text-sm font-bold">{comment.author_name}</p>
              <p className="text-base mt-0.5">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      {track && <AddCommentModal trackId={track.id} />}
    </main>
  )
}
