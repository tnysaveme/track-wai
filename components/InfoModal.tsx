'use client'

import { useState, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { setThemeColorForModal } from '@/lib/theme-color'

type ModalState = 'closed' | 'open' | 'closing'
const CLOSE_DURATION = 180 // ms — matches modal-panel-out duration

export default function InfoModal() {
  const [modal, setModal] = useState<ModalState>('closed')

  function openModal() {
    setThemeColorForModal(true)
    setModal('open')
  }

  function closeModal() {
    if (modal !== 'open') return
    setModal('closing')
    setTimeout(() => {
      setModal('closed')
      setThemeColorForModal(false)
    }, CLOSE_DURATION)
  }

  useEffect(() => {
    if (modal === 'closed') return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modal])

  const isClosing = modal === 'closing'

  return (
    <>
      <button
        onClick={openModal}
        aria-label="How this works"
        className="transition-opacity hover:opacity-60 active:scale-95"
      >
        <Info size={18} />
      </button>

      {modal !== 'closed' && (
        <div
          className={`modal-backdrop fixed inset-0 bg-black/20 flex items-center justify-center z-50 ${isClosing ? 'is-closing' : 'is-open'}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-modal-title"
            className={`modal-panel bg-white p-8 mx-4 sm:mx-0 w-full max-w-sm relative ${isClosing ? 'is-closing' : 'is-open'}`}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 transition-opacity hover:opacity-60"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 id="info-modal-title" className="font-bold text-lg mb-6">
              How it works
            </h2>

            <div className="flex flex-col gap-5 text-sm leading-relaxed">
              <div>
                <p className="font-bold mb-1">Your votes are remembered</p>
                <p className="text-gray-500">
                  Likes and dislikes are saved in your browser&apos;s cache so
                  no account needed. Your vote persists between visits as long
                  as you&apos;re on the same device.
                </p>
              </div>

              <div className="border-t border-gray-100" />

              <div>
                <p className="font-bold mb-1">Open on your streaming service</p>
                <p className="text-gray-500">
                  Tap the album art to choose between Spotify and Apple Music.
                  You&apos;ll be taken straight to the track or album.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
