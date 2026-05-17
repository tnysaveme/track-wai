'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { addComment } from '@/actions/comments'

type Props = {
  trackId: string
}

const CLOSE_DURATION = 180 // ms — matches modal-panel transition in globals.css

export default function AddCommentModal({ trackId }: Props) {
  const [isVisible, setIsVisible] = useState(false) // in DOM
  const [isOpen, setIsOpen] = useState(false)       // has open appearance
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openModal() {
    setIsVisible(true)
    // Two rAFs: first puts element in DOM, second triggers CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true))
    })
  }

  function closeModal() {
    setIsOpen(false)
    setTimeout(() => {
      setIsVisible(false)
      setName('')
      setBody('')
      setError('')
    }, CLOSE_DURATION)
  }

  useEffect(() => {
    if (!isVisible) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isVisible])

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

    closeModal()
    setSubmitting(false)
  }

  return (
    <>
      <button
        onClick={openModal}
        aria-label="Add comment"
        className="fixed bottom-8 right-8 text-3xl font-light leading-none transition-transform duration-150 hover:scale-110 active:scale-95"
      >
        +
      </button>

      {isVisible && (
        <div
          className={`modal-backdrop fixed inset-0 bg-black/20 flex items-center justify-center z-50${isOpen ? ' is-open' : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`modal-panel bg-white p-8 w-full max-w-md relative${isOpen ? ' is-open' : ''}`}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 transition-opacity hover:opacity-60"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 id="modal-title" className="font-bold text-lg mb-6">Add a comment</h2>

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
                className="self-end font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-60"
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
