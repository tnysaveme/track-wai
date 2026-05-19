import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import AdminPasswordGate from '@/components/AdminPasswordGate'
import TrackSearchForm from '@/components/TrackSearchForm'
import TrackHistoryActions from '@/components/TrackHistoryActions'
import ActiveTrackActions from '@/components/ActiveTrackActions'
import AdminActiveTrackStats from '@/components/AdminActiveTrackStats'
import { verifyAdminSession, logoutAdmin } from '@/actions/admin'

export default async function BackstagePage() {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) return <AdminPasswordGate />

  const supabase = createServiceClient()

  const { data: activeTrack } = await supabase
    .from('tracks')
    .select('*, comments(count)')
    .eq('is_active', true)
    .single()

  const { data: history } = await supabase
    .from('tracks')
    .select('*, comments(count)')
    .eq('is_active', false)
    .order('deactivated_at', { ascending: false })

  return (
    <main className="min-h-screen bg-background p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-xl font-bold">Track Wai — Admin</h1>
        <form action={logoutAdmin}>
          <button type="submit" className="text-sm text-gray-500 transition-opacity hover:opacity-60">
            Log out
          </button>
        </form>
      </div>

      <section className="mb-10">
        <h2 className="font-bold text-lg mb-4">Now Playing</h2>
        {activeTrack ? (
          <div>
            <div className="flex items-center gap-4">
              <Image
                src={activeTrack.itunes_album_art_url}
                alt={activeTrack.itunes_track_name}
                width={64}
                height={64}
                className="object-cover shrink-0"
                sizes="64px"
              />
              <div>
                <p className="font-bold text-sm">{activeTrack.itunes_artist_name}</p>
                <p className="text-sm">{activeTrack.itunes_track_name}</p>
                <span className="text-xs text-gray-500 capitalize">{activeTrack.item_type}</span>
              </div>
            </div>
            <AdminActiveTrackStats
              trackId={activeTrack.id}
              initialLikes={activeTrack.likes ?? 0}
              initialDislikes={activeTrack.dislikes ?? 0}
              initialCommentCount={
                Array.isArray(activeTrack.comments) && activeTrack.comments[0]
                  ? (activeTrack.comments[0] as { count: number }).count
                  : 0
              }
            />
            <ActiveTrackActions
              trackId={activeTrack.id}
              trackName={activeTrack.itunes_track_name}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No track set yet.</p>
        )}
      </section>

      <TrackSearchForm />

      <section>
        <h2 className="font-bold text-lg mb-4">History</h2>
        {!history || history.length === 0 ? (
          <p className="text-sm text-gray-500">No history yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((track) => {
              const commentCount =
                Array.isArray(track.comments) && track.comments[0]
                  ? (track.comments[0] as { count: number }).count
                  : 0
              const dateStr = track.deactivated_at
                ? new Date(track.deactivated_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'

              return (
                <div key={track.id} className="flex items-start gap-3 transition-opacity duration-200 hov:opacity-80">
                  <Image
                    src={track.itunes_album_art_url}
                    alt={track.itunes_track_name}
                    width={48}
                    height={48}
                    className="object-cover shrink-0 mt-0.5"
                    sizes="48px"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{track.itunes_artist_name}</p>
                    <p className="text-sm">{track.itunes_track_name}</p>
                    <p className="text-xs text-gray-500">
                      {track.likes} likes · {track.dislikes} dislikes · {commentCount} comments · {dateStr}
                    </p>
                    <TrackHistoryActions
                      trackId={track.id}
                      trackName={track.itunes_track_name}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
