'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { reactivateTrack, deleteTrack } from '@/actions/tracks'
import { Spinner } from '@/components/Spinner'

type Props = {
  trackId: string
  trackName: string
}

export default function TrackHistoryActions({ trackId, trackName }: Props) {
  const [loading, setLoading] = useState<'reactivate' | 'delete' | null>(null)

  async function handleReactivate() {
    setLoading('reactivate')
    const result = await reactivateTrack(trackId)
    if (result.error) {
      toast.error(result.error)
      setLoading(null)
    } else {
      toast.success(`Now playing: ${trackName}`)
      // Keep loading while the page refreshes after reactivation
    }
  }

  async function handleDelete() {
    setLoading('delete')
    const result = await deleteTrack(trackId)
    if (result.error) {
      toast.error(result.error)
      setLoading(null)
    } else {
      toast.success(`Deleted: ${trackName}`)
    }
  }

  return (
    <div className="flex gap-4 mt-1">
      <button
        onClick={handleReactivate}
        disabled={loading !== null}
        className="text-sm font-bold transition-opacity hover:opacity-60 active:scale-95 py-2 disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading === 'reactivate' && <Spinner />}
        {loading === 'reactivate' ? 'Reactivating' : 'Reactivate'}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="text-sm text-red-500 transition-opacity hover:opacity-60 active:scale-95 py-2 disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading === 'delete' && <Spinner />}
        {loading === 'delete' ? 'Deleting' : 'Delete'}
      </button>
    </div>
  )
}
