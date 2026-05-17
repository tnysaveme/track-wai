'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Props = {
  src: string
  alt: string
  spotifyUrl: string
  appleMusicUrl: string | null
}

// Monochrome Lucide-style: three concentric arcs — the Spotify signal shape
function SpotifyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2.5 6.5C6.5 4 13.5 4 17.5 6.5" />
      <path d="M4 10.5C7.2 8.5 12.8 8.5 16 10.5" />
      <path d="M6 14.5C8.2 13.1 11.8 13.1 14 14.5" />
    </svg>
  )
}

// Monochrome Lucide-style: double music note
function AppleMusicIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 15V5.5l8-1.5V13" />
      <circle cx="7" cy="15" r="2" />
      <circle cx="15" cy="13" r="2" />
    </svg>
  )
}

export default function AlbumArt({ src, alt, spotifyUrl, appleMusicUrl }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // If no Apple Music URL, clicking the art goes straight to Spotify
  const hasBothServices = !!appleMusicUrl

  useEffect(() => {
    if (!showPicker) return
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowPicker(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [showPicker])

  function handleImageClick() {
    if (!hasBothServices) {
      window.open(spotifyUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setShowPicker((p) => !p)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[375px]">
      <button
        onClick={handleImageClick}
        className="block w-full transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-[0.99]"
        aria-label={hasBothServices ? 'Choose a streaming service' : 'Open on Spotify'}
        aria-expanded={hasBothServices ? showPicker : undefined}
      >
        <Image
          src={src}
          alt={alt}
          width={375}
          height={375}
          className="w-full h-auto object-cover"
          sizes="(max-width: 440px) calc(100vw - 4rem), 375px"
          priority
        />
      </button>

      {/* Floating service picker — inset from all edges, sits over the bottom of the image */}
      <div
        className="absolute inset-x-3 bottom-3 pointer-events-none"
        style={{
          clipPath: showPicker ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
          transition: 'clip-path 380ms cubic-bezier(0.76, 0, 0.24, 1)',
        }}
        aria-hidden={!showPicker}
      >
        <div
          className="flex bg-white border border-black divide-x divide-black pointer-events-auto"
        >
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowPicker(false)}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5
              text-[10px] font-bold tracking-[0.18em] uppercase
              transition-colors duration-150 hover:bg-black hover:text-white"
          >
            <SpotifyIcon />
            Spotify
          </a>
          {appleMusicUrl && (
            <a
              href={appleMusicUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowPicker(false)}
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5
                text-[10px] font-bold tracking-[0.18em] uppercase
                transition-colors duration-150 hover:bg-black hover:text-white"
            >
              <AppleMusicIcon />
              Apple Music
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
