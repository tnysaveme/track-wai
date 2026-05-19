'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CommentsError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[app/comments/error]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-xl font-bold">Comments</h1>
        <Link href="/" aria-label="Back to home" className="p-2 -mr-2 transition-opacity hover:opacity-60">
          <ArrowLeft size={20} />
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm text-gray-500">Couldn&apos;t load comments.</p>
        <button
          onClick={reset}
          className="text-sm font-bold transition-opacity hover:opacity-60"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
