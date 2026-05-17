import { createServiceClient } from '@/lib/supabase/server'
import AlbumArt from '@/components/AlbumArt'
import AudioPlayer from '@/components/AudioPlayer'
import ReactionBar from '@/components/ReactionBar'
import RealtimeTrackRefresh from '@/components/RealtimeTrackRefresh'

export default async function HomePage() {
  const supabase = createServiceClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('*')
    .eq('is_active', true)
    .single()

  const commentCount = track
    ? ((await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('track_id', track.id)).count ?? 0)
    : 0

  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="text-xl font-bold">Track Wai</h1>

      {!track ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-500">I&apos;ll put you on soon</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 pt-12 sm:pt-24">
          <RealtimeTrackRefresh trackId={track.id} />

          <AlbumArt
            src={track.itunes_album_art_url}
            alt={`${track.itunes_track_name} album art`}
            spotifyUrl={track.spotify_url}
          />

          <p className="text-base">
            <span className="font-bold">{track.itunes_artist_name}</span>
            {' - '}
            <span>{track.itunes_track_name}</span>
          </p>

          {track.item_type === 'song' && track.itunes_preview_url && (
            <AudioPlayer previewUrl={track.itunes_preview_url} />
          )}

          <ReactionBar
            trackId={track.id}
            initialLikes={track.likes}
            initialDislikes={track.dislikes}
            commentCount={commentCount}
          />
        </div>
      )}
    </main>
  )
}
