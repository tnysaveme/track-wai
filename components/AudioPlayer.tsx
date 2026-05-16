'use client'

import { useState, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

type Props = {
  previewUrl: string
}

export default function AudioPlayer({ previewUrl }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <>
      <audio ref={audioRef} src={previewUrl} onEnded={() => setIsPlaying(false)} />
      <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <Pause size={28} /> : <Play size={28} />}
      </button>
    </>
  )
}
