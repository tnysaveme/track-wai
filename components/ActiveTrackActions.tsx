'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { deactivateActiveTrack, deleteTrack } from '@/actions/tracks'
import { Spinner } from '@/components/Spinner'

type Props = {
  trackId: string
  trackName: string
}

export default function ActiveTrackActions({ trackId, trackName }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [loading, setLoading] = useState<'deactivate' | 'delete' | null>(null)

  const busy = loading !== null

  async function handleDeactivate() {
    setLoading('deactivate')
    const result = await deactivateActiveTrack(trackId)
    if (result.error) {
      toast.error(result.error)
      setLoading(null)
    } else {
      toast.success(`Deactivated: ${trackName}`)
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    setLoading('delete')
    const result = await deleteTrack(trackId)
    if (result.error) {
      toast.error(result.error)
      setConfirmingDelete(false)
      setLoading(null)
    } else {
      toast.success(`Deleted: ${trackName}`)
    }
  }

  return (
    <div className="mt-4">
      {confirmingDelete ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-red-500">Delete this track? This can&apos;t be undone.</span>
          <div className="flex gap-4">
            <button
              onClick={handleDelete}
              disabled={busy}
              className="text-sm font-bold text-red-500 disabled:opacity-50 transition-opacity hover:opacity-60 active:scale-95 py-2 flex items-center gap-1.5"
            >
              {loading === 'delete' && <Spinner />}
              {loading === 'delete' ? 'Deleting' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
              className="text-sm text-gray-400 disabled:opacity-50 transition-opacity hover:opacity-60 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={handleDeactivate}
            disabled={busy}
            className="text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-60 active:scale-95 py-2 flex items-center gap-1.5"
          >
            {loading === 'deactivate' && <Spinner />}
            {loading === 'deactivate' ? 'Deactivating' : 'Deactivate'}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-sm text-red-500 disabled:opacity-50 transition-opacity hover:opacity-60 active:scale-95 py-2 flex items-center gap-1.5"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
