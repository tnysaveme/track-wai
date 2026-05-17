# Realtime Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live updates to Track Wai so likes, dislikes, comment counts, the comments list, and active track all update in real-time without a page refresh.

**Architecture:** Supabase Realtime (postgres_changes) powers all subscriptions using the public anon key in a singleton browser client. `ReactionBar` subscribes to `tracks` row updates for live like/dislike counts and to `comments` inserts for live comment count. A new `CommentsList` Client Component subscribes to `comments` inserts to prepend new comments instantly. A thin `RealtimeTrackRefresh` Client Component subscribes to `tracks` inserts and calls `router.refresh()` to re-render the homepage Server Component when the admin switches the active track.

**Tech Stack:** `@supabase/supabase-js` v2 (already installed), Supabase Realtime postgres_changes, Next.js `useRouter` + `router.refresh()`

---

## File Map

| File | Role |
|---|---|
| `lib/supabase/client.ts` | Singleton browser Supabase client (anon key) |
| `components/ReactionBar.tsx` | Modified — subscribe to `tracks` UPDATE and `comments` INSERT |
| `components/CommentsList.tsx` | New — Client Component, renders comments list + subscribes to inserts |
| `components/RealtimeTrackRefresh.tsx` | New — invisible Client Component, triggers router.refresh() on track change |
| `app/comments/page.tsx` | Modified — pass initial comments to `CommentsList` |
| `app/page.tsx` | Modified — mount `<RealtimeTrackRefresh>` |
| `supabase/migrations/006_enable_realtime.sql` | Enable Realtime publication on both tables |

---

## Task 1: Enable Supabase Realtime on Tables

**Files:**
- Create: `supabase/migrations/006_enable_realtime.sql`

Supabase Realtime only broadcasts changes for tables that are added to the `supabase_realtime` publication. This must be done before any subscription will fire.

- [ ] **Step 1: Run the SQL in Supabase dashboard**

Go to Supabase dashboard → SQL Editor and run:

```sql
alter publication supabase_realtime add table tracks;
alter publication supabase_realtime add table comments;
```

Expected: "Success. No rows returned."

- [ ] **Step 2: Save the migration**

Create `supabase/migrations/006_enable_realtime.sql`:

```sql
alter publication supabase_realtime add table tracks;
alter publication supabase_realtime add table comments;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/006_enable_realtime.sql
git commit -m "feat: enable Supabase Realtime on tracks and comments tables"
```

---

## Task 2: Browser Supabase Client

**Files:**
- Create: `lib/supabase/client.ts`

The existing `lib/supabase/server.ts` uses the service role key and is server-only. The browser client uses the public anon key, which is safe to expose (prefixed `NEXT_PUBLIC_`). We use a module-level singleton so all Client Components share one connection.

- [ ] **Step 1: Create the browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Verify it imports cleanly**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors related to `lib/supabase/client.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/client.ts
git commit -m "feat: add browser Supabase client for Realtime subscriptions"
```

---

## Task 3: Realtime Likes/Dislikes and Comment Count in ReactionBar

**Files:**
- Modify: `components/ReactionBar.tsx`

`ReactionBar` already manages `likes`, `dislikes`, and `commentCount` in local state. We add two Supabase Realtime subscriptions inside `useEffect`:
1. Subscribe to `UPDATE` events on the `tracks` table filtered by `id=eq.<trackId>` — update `likes` and `dislikes` from the payload.
2. Subscribe to `INSERT` events on the `comments` table filtered by `track_id=eq.<trackId>` — increment `commentCount` by 1.

Both subscriptions must be cleaned up on unmount by calling `supabase.removeChannel(channel)`.

**Important:** The realtime payload gives us the ground-truth DB value, so we overwrite local optimistic state with it. This also self-corrects any optimistic update that diverged.

- [ ] **Step 1: Read the current ReactionBar**

The current file is at `components/ReactionBar.tsx`. Key existing state:
```typescript
const [likes, setLikes] = useState(initialLikes)
const [dislikes, setDislikes] = useState(initialDislikes)
const [vote, setVote] = useState<VoteState>(null)
```
`commentCount` is currently a prop, not state. We need to lift it into state so realtime can update it.

- [ ] **Step 2: Update ReactionBar with realtime subscriptions**

Replace `components/ReactionBar.tsx` with:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { likeTrack, unlikeTrack, dislikeTrack, undislikeTrack } from '@/actions/reactions'
import { supabaseBrowser } from '@/lib/supabase/client'

type VoteState = 'liked' | 'disliked' | null

type Props = {
  trackId: string
  initialLikes: number
  initialDislikes: number
  commentCount: number
}

const VOTE_KEY = 'trackwai_vote'

export default function ReactionBar({ trackId, initialLikes, initialDislikes, commentCount: initialCommentCount }: Props) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [vote, setVote] = useState<VoteState>(null)

  useEffect(() => {
    setLikes(initialLikes)
    setDislikes(initialDislikes)
  }, [initialLikes, initialDislikes])

  useEffect(() => {
    setCommentCount(initialCommentCount)
  }, [initialCommentCount])

  useEffect(() => {
    const stored = localStorage.getItem(VOTE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { trackId: string; vote: VoteState }
        if (parsed.trackId === trackId) setVote(parsed.vote)
      } catch {
        localStorage.removeItem(VOTE_KEY)
      }
    }
  }, [trackId])

  // Realtime: sync likes/dislikes from DB
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`track-reactions-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tracks', filter: `id=eq.${trackId}` },
        (payload) => {
          const updated = payload.new as { likes: number; dislikes: number }
          setLikes(updated.likes)
          setDislikes(updated.dislikes)
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [trackId])

  // Realtime: increment comment count on new comment
  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`track-comments-count-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `track_id=eq.${trackId}` },
        () => {
          setCommentCount((c) => c + 1)
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [trackId])

  function saveVote(newVote: VoteState) {
    setVote(newVote)
    localStorage.setItem(VOTE_KEY, JSON.stringify({ trackId, vote: newVote }))
  }

  async function handleLike() {
    const prevVote = vote
    const prevLikes = likes
    const prevDislikes = dislikes

    if (vote === 'liked') {
      setLikes((l) => l - 1)
      saveVote(null)
      const result = await unlikeTrack(trackId)
      if (result.error) {
        setLikes(prevLikes)
        saveVote(prevVote)
      }
    } else {
      if (vote === 'disliked') {
        setDislikes((d) => d - 1)
        const undislikeResult = await undislikeTrack(trackId)
        if (undislikeResult.error) {
          setDislikes(prevDislikes)
          return
        }
      }
      setLikes((l) => l + 1)
      saveVote('liked')
      const result = await likeTrack(trackId)
      if (result.error) {
        setLikes(prevLikes)
        setDislikes(prevDislikes)
        saveVote(prevVote)
      }
    }
  }

  async function handleDislike() {
    const prevVote = vote
    const prevLikes = likes
    const prevDislikes = dislikes

    if (vote === 'disliked') {
      setDislikes((d) => d - 1)
      saveVote(null)
      const result = await undislikeTrack(trackId)
      if (result.error) {
        setDislikes(prevDislikes)
        saveVote(prevVote)
      }
    } else {
      if (vote === 'liked') {
        setLikes((l) => l - 1)
        const unlikeResult = await unlikeTrack(trackId)
        if (unlikeResult.error) {
          setLikes(prevLikes)
          return
        }
      }
      setDislikes((d) => d + 1)
      saveVote('disliked')
      const result = await dislikeTrack(trackId)
      if (result.error) {
        setLikes(prevLikes)
        setDislikes(prevDislikes)
        saveVote(prevVote)
      }
    }
  }

  return (
    <div className="flex gap-12 items-start">
      <button onClick={handleLike} className="flex flex-col items-center gap-1" aria-label="Like">
        <Heart size={24} fill={vote === 'liked' ? 'red' : 'none'} stroke={vote === 'liked' ? 'red' : 'currentColor'} strokeWidth={vote === 'liked' ? 0 : 2} />
        <span className="text-sm">{likes}</span>
      </button>

      <Link href="/comments" className="flex flex-col items-center gap-1" aria-label="Comments">
        <MessageCircle size={24} />
        <span className="text-sm">{commentCount}</span>
      </Link>

      <button onClick={handleDislike} className="flex flex-col items-center gap-1" aria-label="Dislike">
        <ThumbsDown size={24} fill={vote === 'disliked' ? 'black' : 'none'} strokeWidth={vote === 'disliked' ? 0 : 2} />
        <span className="text-sm">{dislikes}</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test -- --no-coverage
```

Expected: 11 tests pass. (ReactionBar has no unit tests — the change is additive.)

- [ ] **Step 4: Verify in browser**

Start dev server (`npm run dev`). Open two browser windows side by side at `http://localhost:3000`. Like in one window — the count should update in the other within ~1 second without a refresh.

- [ ] **Step 5: Commit**

```bash
git add components/ReactionBar.tsx
git commit -m "feat: add realtime likes/dislikes and comment count to ReactionBar"
```

---

## Task 4: Realtime Comments List

**Files:**
- Create: `components/CommentsList.tsx`
- Modify: `app/comments/page.tsx`

The comments page is a Server Component that renders the list inline. To add realtime, we extract the list into a new `CommentsList` Client Component that receives initial comments as a prop and subscribes to `INSERT` events on the `comments` table, prepending new comments to the top of the list.

The Server Component passes initial data down; `CommentsList` takes over from there.

- [ ] **Step 1: Create CommentsList**

Create `components/CommentsList.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

type Comment = {
  id: string
  author_name: string
  body: string
  created_at: string
}

type Props = {
  trackId: string
  initialComments: Comment[]
}

export default function CommentsList({ trackId, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`comments-list-${trackId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `track_id=eq.${trackId}` },
        (payload) => {
          const newComment = payload.new as Comment
          setComments((prev) => [newComment, ...prev])
        },
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [trackId])

  if (comments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Whatcha say?</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg ml-[15%]">
      {comments.map((comment) => (
        <div key={comment.id}>
          <p className="text-sm font-bold">{comment.author_name}</p>
          <p className="text-base mt-0.5">{comment.body}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Update the comments page**

Replace `app/comments/page.tsx`:

```typescript
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import AddCommentModal from '@/components/AddCommentModal'
import CommentsList from '@/components/CommentsList'

export default async function CommentsPage() {
  const supabase = createServiceClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('id')
    .eq('is_active', true)
    .single()

  const initialComments = track
    ? ((
        await supabase
          .from('comments')
          .select('id, author_name, body, created_at')
          .eq('track_id', track.id)
          .order('created_at', { ascending: false })
      ).data ?? [])
    : []

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-xl font-bold">Comments</h1>
        <Link href="/" aria-label="Back to home">
          <ArrowLeft size={20} />
        </Link>
      </div>

      {track ? (
        <>
          <CommentsList trackId={track.id} initialComments={initialComments} />
          <AddCommentModal trackId={track.id} />
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Whatcha say?</p>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test -- --no-coverage
```

Expected: 11 tests pass.

- [ ] **Step 4: Verify in browser**

Open two windows at `http://localhost:3000/comments`. In one window, click `+` and post a comment. The other window should show the new comment appear at the top within ~1 second without a refresh.

- [ ] **Step 5: Commit**

```bash
git add components/CommentsList.tsx app/comments/page.tsx
git commit -m "feat: add realtime comments list"
```

---

## Task 5: Realtime Track Switch Refresh on Homepage

**Files:**
- Create: `components/RealtimeTrackRefresh.tsx`
- Modify: `app/page.tsx`

When the admin sets a new active track, the homepage Server Component needs to re-render with the new track data. We add a thin invisible Client Component that subscribes to `INSERT` events on the `tracks` table (every new active track is a new row). When a new track row is detected, it calls `router.refresh()` which tells Next.js to re-fetch the Server Component from the server — no full page reload, just a silent data refresh.

- [ ] **Step 1: Create RealtimeTrackRefresh**

Create `components/RealtimeTrackRefresh.tsx`:

```typescript
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
```

- [ ] **Step 2: Mount it on the homepage**

Modify `app/page.tsx`. Add the import and render `<RealtimeTrackRefresh>` inside the track branch. The full updated file:

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import AlbumArt from '@/components/AlbumArt'
import AudioPlayer from '@/components/AudioPlayer'
import ReactionBar from '@/components/ReactionBar'
import RealtimeTrackRefresh from '@/components/RealtimeTrackRefresh'

export default async function HomePage() {
  const supabase = createServiceClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('*')
    .eq('is_active', true)
    .single()

  const commentCount = track
    ? ((await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('track_id', track.id)).count ?? 0)
    : 0

  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="text-xl font-bold">Track Wai</h1>

      {!track ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-500">I&apos;ll put you on soon</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 pt-24">
          <RealtimeTrackRefresh trackId={track.id} />

          <AlbumArt
            src={track.itunes_album_art_url}
            alt={`${track.itunes_track_name} album art`}
            spotifyUrl={track.spotify_url}
          />

          <p className="text-base">
            <span className="font-bold">{track.itunes_artist_name}</span>
            {' - '}
            <span>{track.itunes_track_name}</span>
          </p>

          {track.item_type === 'song' && track.itunes_preview_url && (
            <AudioPlayer previewUrl={track.itunes_preview_url} />
          )}

          <ReactionBar
            trackId={track.id}
            initialLikes={track.likes}
            initialDislikes={track.dislikes}
            commentCount={commentCount}
          />
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test -- --no-coverage
```

Expected: 11 tests pass.

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3000` in a browser. In another tab, go to `http://localhost:3000/backstage`, log in, and set a new track. The homepage tab should silently update to show the new track within ~1 second without a manual refresh.

- [ ] **Step 5: Commit**

```bash
git add components/RealtimeTrackRefresh.tsx app/page.tsx
git commit -m "feat: auto-refresh homepage when admin sets a new track"
```
