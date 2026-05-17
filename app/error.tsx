'use client'

import { useEffect } from 'react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-white p-8 flex flex-col items-center justify-center gap-4">
      <p className="text-sm text-gray-500">Something went wrong.</p>
      <button
        onClick={reset}
        className="text-sm font-bold transition-opacity hover:opacity-60"
      >
        Try again
      </button>
    </main>
  )
}
