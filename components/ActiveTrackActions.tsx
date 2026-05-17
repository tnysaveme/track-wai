'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { deactivateActiveTrack, deleteTrack } from '@/actions/tracks'

type Props = {
  trackId: string
  trackName: string
}

export default function ActiveTrackActions({ trackId, trackName }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDeactivate() {
    setLoading(true)
    const result = await deactivateActiveTrack(trackId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Deactivated: ${trackName}`)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    setLoading(true)
    const result = await deleteTrack(trackId)
    if (result.error) {
      toast.error(result.error)
      setConfirmingDelete(false)
    } else {
      toast.success(`Deleted: ${trackName}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex gap-4 mt-3">
      <button
        onClick={handleDeactivate}
        disabled={loading}
        className="text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-60 active:scale-95"
      >
        Deactivate
      </button>

      {confirmingDelete ? (
        <div className="flex gap-3 items-center">
          <span className="text-sm text-red-500">Are you sure?</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-sm font-bold text-red-500 disabled:opacity-50 transition-opacity hover:opacity-60 active:scale-95"
          >
            Yes, delete
          </button>
          <button
            onClick={() => setConfirmingDelete(false)}
            disabled={loading}
            className="text-sm text-gray-400 disabled:opacity-50 transition-opacity hover:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm text-red-500 disabled:opacity-50 transition-opacity hover:opacity-60 active:scale-95"
        >
          Delete
        </button>
      )}
    </div>
  )
}
