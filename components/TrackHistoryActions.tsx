'use client'

import { toast } from 'sonner'
import { reactivateTrack, deleteTrack } from '@/actions/tracks'

type Props = {
  trackId: string
  trackName: string
}

export default function TrackHistoryActions({ trackId, trackName }: Props) {
  async function handleReactivate() {
    const result = await reactivateTrack(trackId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Now playing: ${trackName}`)
    }
  }

  async function handleDelete() {
    const result = await deleteTrack(trackId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Deleted: ${trackName}`)
    }
  }

  return (
    <div className="flex gap-4 mt-1">
      <button onClick={handleReactivate} className="text-sm font-bold transition-opacity hover:opacity-60 active:scale-95 py-2">
        Reactivate
      </button>
      <button onClick={handleDelete} className="text-sm text-red-500 transition-opacity hover:opacity-60 active:scale-95 py-2">
        Delete
      </button>
    </div>
  )
}
