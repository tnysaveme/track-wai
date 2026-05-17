'use client'

import { useState } from 'react'
import { checkAdminPassword } from '@/actions/admin'

export default function AdminPasswordGate() {
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await checkAdminPassword(formData)
    if (result?.error) setError(result.error)
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
          className="border-b border-black outline-none py-1 text-sm"
          placeholder="Password"
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="font-bold text-sm self-start">
          Enter
        </button>
      </form>
    </main>
  )
}
