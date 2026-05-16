'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { addComment } from '@/actions/comments'

type Props = {
  trackId: string
}

export default function AddCommentModal({ trackId }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const result = await addComment(trackId, name, body)

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setName('')
    setBody('')
    setOpen(false)
    setSubmitting(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add comment"
        className="fixed bottom-8 right-8 text-3xl font-light leading-none"
      >
        +
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-8 w-full max-w-md relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="font-bold text-lg mb-6">Add a comment</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold mb-1" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border-b border-black outline-none py-1 text-sm"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1" htmlFor="body">
                  Comment
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={3}
                  className="w-full border-b border-black outline-none py-1 text-sm resize-none"
                  placeholder="What do you think?"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="self-end font-bold text-sm disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
