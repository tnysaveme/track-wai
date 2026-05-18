'use client'

import { useState } from 'react'
import { checkAdminPassword } from '@/actions/admin'
import { Spinner } from '@/components/Spinner'

export default function AdminPasswordGate() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await checkAdminPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success the server redirects — keep loading=true so the button
    // stays in the loading state while the navigation happens.
  }

  return (
    <main className="min-h-screen bg-white p-8 flex flex-col justify-center items-center">
      <h1 className="text-xl font-bold mb-8">Track Wai</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="border-b border-black outline-none py-2 text-base"
          placeholder="Password"
          autoFocus
          disabled={loading}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="font-bold text-base self-start py-1 flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading && <Spinner />}
          {loading ? 'Entering' : 'Enter'}
        </button>
      </form>
    </main>
  )
}
