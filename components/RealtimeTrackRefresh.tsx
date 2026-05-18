'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

// Unique suffix per module load — avoids channel name collisions across tabs
const CHANNEL_ID = `active-track-change-${crypto.randomUUID()}`

export default function RealtimeTrackRefresh() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    const refresh = () => routerRef.current.refresh()

    // track_events INSERT: server actions insert a row here after every mutation.
    // Because anon can always read track_events rows (open RLS policy), the INSERT
    // event is always delivered — unlike UPDATE on tracks, where deactivation flips
    // is_active=false and the row drops out of the anon RLS policy, causing Supabase
    // to silently drop the UPDATE event before it reaches the client.
    const channel = supabaseBrowser
      .channel(CHANNEL_ID)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'track_events' }, refresh)
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, []) // stable — channel doesn't depend on trackId or router reference

  return null
}
