'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

// Unique suffix per module load — avoids channel name collisions across tabs
const CHANNEL_ID = `active-track-change-${crypto.randomUUID()}`

type Props = {
  trackId: string
}

export default function RealtimeTrackRefresh({ trackId }: Props) {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(CHANNEL_ID)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tracks' },
        () => {
          routerRef.current.refresh()
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, []) // stable — channel doesn't depend on trackId or router reference

  return null
}
