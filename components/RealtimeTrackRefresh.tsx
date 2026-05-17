'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

type Props = {
  trackId: string
}

export default function RealtimeTrackRefresh({ trackId }: Props) {
  const router = useRouter()

  useEffect(() => {
    const channel = supabaseBrowser
      .channel('active-track-change')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tracks' },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [router])

  return null
}
