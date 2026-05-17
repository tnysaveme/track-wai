'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

type Props = {
  previewUrl: string
}

export default function AudioPlayer({ previewUrl }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [previewUrl])

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false))
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <>
      <audio ref={audioRef} src={previewUrl} onEnded={() => setIsPlaying(false)} />
      <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        <span className="inline-grid">
          <span
            className="[grid-area:1/1]"
            style={{
              opacity: isPlaying ? 0 : 1,
              filter: isPlaying ? 'blur(var(--icon-swap-blur))' : 'blur(0px)',
              transform: isPlaying ? 'scale(var(--icon-swap-start-scale))' : 'scale(1)',
              transition: 'opacity var(--icon-swap-dur) var(--icon-swap-ease), filter var(--icon-swap-dur) var(--icon-swap-ease), transform var(--icon-swap-dur) var(--icon-swap-ease)',
              willChange: 'opacity, filter, transform',
            }}
          >
            <Play size={28} fill="black" strokeWidth={0} />
          </span>
          <span
            className="[grid-area:1/1]"
            style={{
              opacity: isPlaying ? 1 : 0,
              filter: isPlaying ? 'blur(0px)' : 'blur(var(--icon-swap-blur))',
              transform: isPlaying ? 'scale(1)' : 'scale(var(--icon-swap-start-scale))',
              transition: 'opacity var(--icon-swap-dur) var(--icon-swap-ease), filter var(--icon-swap-dur) var(--icon-swap-ease), transform var(--icon-swap-dur) var(--icon-swap-ease)',
              willChange: 'opacity, filter, transform',
            }}
          >
            <Pause size={28} fill="black" strokeWidth={0} />
          </span>
        </span>
      </button>
    </>
  )
}
