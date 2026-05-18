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
    const refresh = () => routerRef.current.refresh()

    // postgres_changes covers INSERT (new track set) and UPDATE on rows still
    // visible to the anon key (e.g. likes/dislikes changes on the active track).
    const pgChannel = supabaseBrowser
      .channel(CHANNEL_ID)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tracks' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tracks' }, refresh)
      .subscribe()

    // Broadcast channel receives signals from server actions for mutations where
    // the updated row becomes invisible to anon (deactivation flips is_active=false,
    // which violates the RLS policy, so the postgres UPDATE event is never delivered).
    const broadcastChannel = supabaseBrowser
      .channel('track-events')
      .on('broadcast', { event: 'track:changed' }, refresh)
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(pgChannel)
      supabaseBrowser.removeChannel(broadcastChannel)
    }
  }, []) // stable — channels don't depend on trackId or router reference

  return null
}
