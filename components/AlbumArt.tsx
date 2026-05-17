'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Props = {
  src: string
  alt: string
  spotifyUrl: string
  appleMusicUrl: string | null
}

function SpotifyIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="#1DB954" />
      <path
        d="M30.3 29.8c-.3.5-1 .7-1.5.3-4.2-2.6-9.5-3.1-15.7-1.7-.6.1-1.2-.2-1.3-.8-.1-.6.2-1.2.8-1.3 6.8-1.6 12.7-.9 17.3 2 .6.3.8 1.1.4 1.5zm1.9-4.5c-.4.6-1.3.9-2 .4-4.8-3-12.1-3.8-17.8-2.1-.7.2-1.5-.2-1.7-.9-.2-.7.2-1.5.9-1.7 6.5-2 14.6-1 20.2 2.4.7.5.9 1.4.4 1.9zm.2-4.7C27.3 17.2 18 16.8 12.4 18.5c-.9.3-1.8-.2-2.1-1.1-.3-.9.2-1.8 1.1-2.1 6.4-1.9 16.9-1.5 23.6 2.5.9.5 1.1 1.6.6 2.4-.5.8-1.6 1.1-2.4.6l.3.3z"
        fill="white"
      />
    </svg>
  )
}

function AppleMusicIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <defs>
        <linearGradient id="am-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FC5C7D" />
          <stop offset="100%" stopColor="#6A3093" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="10" fill="url(#am-grad)" />
      <path
        d="M29 12.5v12.3c0 2-1.6 3.6-3.6 3.6s-3.6-1.6-3.6-3.6 1.6-3.6 3.6-3.6c.7 0 1.3.2 1.9.5V14.8l-9.9 2.2v10.4c0 2-1.6 3.6-3.6 3.6S10 29.4 10 27.4s1.6-3.6 3.6-3.6c.7 0 1.3.2 1.9.5V13l13.5-2.9V12.5z"
        fill="white"
      />
    </svg>
  )
}

export default function AlbumArt({ src, alt, spotifyUrl, appleMusicUrl }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={containerRef} className="relative w-full max-w-[375px]">
      <button
        onClick={() => setShowPicker((p) => !p)}
        className="block w-full transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-[0.99]"
        aria-label="Listen on a streaming service"
        aria-expanded={showPicker}
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

      {/* Streaming picker — frosted panel over the bottom of the image */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-10 py-5
          bg-white/90 backdrop-blur-md border-t border-black/8
          transition-all duration-300 ease-out
          ${showPicker ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}
        aria-hidden={!showPicker}
      >
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setShowPicker(false)}
          className="flex flex-col items-center gap-2 transition-opacity hover:opacity-70"
          aria-label="Open on Spotify"
        >
          <SpotifyIcon />
          <span className="text-xs font-bold tracking-wide">Spotify</span>
        </a>

        {appleMusicUrl && (
          <a
            href={appleMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowPicker(false)}
            className="flex flex-col items-center gap-2 transition-opacity hover:opacity-70"
            aria-label="Open on Apple Music"
          >
            <AppleMusicIcon />
            <span className="text-xs font-bold tracking-wide">Apple Music</span>
          </a>
        )}
      </div>
    </div>
  )
}
