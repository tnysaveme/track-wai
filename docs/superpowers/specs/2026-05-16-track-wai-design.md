# Track Wai — Design Spec
**Date:** 2026-05-16

## Overview

Track Wai is a minimal web app for publicly displaying and playing a featured song or album. Visitors can like, dislike, and comment without logging in. An admin controls which track is currently featured. The design language is clean, white-background, generous whitespace, Figtree font throughout.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| Database | Supabase (`@supabase/ssr`) |
| Styling | Tailwind CSS |
| Icons | Lucide React (`lucide-react`) |
| Font | Figtree via `next/font/google` |
| Music metadata | iTunes Search API (server-side) |
| Music playback | Native `<audio>` element with iTunes `previewUrl` |
| Spotify integration | Spotify Client Credentials API (server-side) |

---

## Routes

| Route | Description |
|---|---|
| `/` | Homepage — album art, player, like/dislike/comments nav |
| `/comments` | Comments page — list + add comment modal |
| `/backstage` | Admin page — secret URL + password gate |

The admin route slug (`/backstage`) is security-through-obscurity combined with a password stored as an environment variable. The session is persisted in a cookie for the browser session.

---

## Data Model (Supabase)

### `tracks` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_type` | text | `'song'` or `'album'` |
| `is_active` | boolean | Exactly one row is `true` at a time |
| `spotify_url` | text | Fetched automatically via Spotify API |
| `itunes_track_name` | text | Fetched from iTunes |
| `itunes_artist_name` | text | Fetched from iTunes |
| `itunes_album_art_url` | text | 600×600 art URL from iTunes |
| `itunes_preview_url` | text | 30-second MP3 URL; null for albums or missing previews |
| `likes` | integer | Global count, default 0 |
| `dislikes` | integer | Global count, default 0 |
| `created_at` | timestamptz | When first set as active |
| `deactivated_at` | timestamptz | Cleared on reactivation; set when replaced |

### `comments` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `track_id` | uuid FK → tracks | |
| `author_name` | text | Free text, no login |
| `body` | text | Comment content |
| `created_at` | timestamptz | |

Comments belong to a specific track and are displayed only when that track is active. They are preserved and restored on reactivation.

---

## Music Fetching Flow

### Admin sets a new track

1. Admin selects **Song** or **Album** toggle.
2. Admin types a search query (e.g. "Giveon KEEPER").
3. Server Action calls the iTunes Search API server-side: `https://itunes.apple.com/search?term=...&entity=song|album&limit=5`
4. Top 5 iTunes results returned to admin as selectable cards (thumbnail, artist, title).
5. Admin picks the correct result.
6. On confirm: Server Action fetches a fresh Spotify Client Credentials token, searches Spotify for the same query (`type=track|album`), and takes the top Spotify result's URL automatically — no second choice for the admin.
7. A new row is inserted into `tracks` as active with both iTunes metadata and the Spotify URL; the previous active row has `is_active` set to `false` and `deactivated_at` stamped. Both updates are wrapped in a single Supabase transaction.

### Homepage render

- Active track data is read from Supabase server-side — no iTunes or Spotify calls at render time.
- Album art served from the stored iTunes URL (600×600).
- Preview playback uses the stored `itunes_preview_url` in a native `<audio>` element.
- Clicking the album art opens `spotify_url` in a new tab.

### Reactivation

- Admin clicks "Reactivate" on any history entry.
- Server Action: sets selected track `is_active = true`, `deactivated_at = null`; sets current active track `is_active = false`, `deactivated_at = now()`. Single transaction.
- All previous likes, dislikes, and comments for the reactivated track are restored automatically (they were never deleted).

---

## Page Designs

### Homepage (`/`)

- **Top-left:** "Track Wai" — Figtree bold
- **Center column, vertically centered:**
  1. Album art — ~375px square, clickable → opens Spotify URL in new tab
  2. `**Artist Name** - Track/Album Title` — bold artist, regular title, same line
  3. Play/Pause button (Lucide `Play` / `Pause`) — **songs only**, hidden for albums
  4. Three icons in a row with counts below:
     - `Heart` — like count; filled/active when user has liked
     - `MessageCircle` — comment count; links to `/comments`
     - `ThumbsDown` — dislike count; filled/active when user has disliked
- **No active track:** Centered message — *"I'll put you on soon"*
- **Like/Dislike rules:** Mutually exclusive. Clicking one removes the other. State stored in `localStorage` keyed by track ID (`{ liked: trackId | null, disliked: trackId | null }`). Counts update optimistically on click then confirmed via Server Action.

### Comments Page (`/comments`)

- **Top-left:** Back arrow (Lucide `ArrowLeft`) + "Comments" title — Figtree bold
- **Comment list:** Left-aligned, newest-first
  - Author name — smaller size, bold
  - Comment body — regular weight, slightly larger, directly below name
  - Generous vertical spacing between entries
- **Empty state:** Centered message — *"Whatcha say?"*
- **Bottom-right fixed:** `+` button (Lucide `Plus`) — opens add comment modal
- **Add comment modal:**
  - Fields: Name (required), Comment (required)
  - Submit via Server Action
  - On success: modal closes, new comment appears at top

### Admin Page (`/backstage`)

- **Password gate:** Environment variable password checked on first visit; session stored in a cookie.
- **Section 1 — Now Playing:** Active track thumbnail, artist, title, type badge (`Song` / `Album`), "Change" button.
- **Section 2 — Set New Track:**
  - Song / Album toggle
  - Search field → server-side iTunes + Spotify fetch → top 5 selectable result cards
  - Confirm button finalises the selection
- **Section 3 — History:** All previous tracks listed with thumbnail, artist, title, type, like/dislike/comment counts, date active, and a "Reactivate" button.

---

## Error Handling & Edge Cases

| Scenario | Behaviour |
|---|---|
| No search results | Inline message: "No results found — try a different search term." |
| `previewUrl` missing from iTunes result | Result still selectable, marked "No preview available." Homepage treats it as an album (no play button). |
| Spotify token expiry (1hr) | Fresh token fetched on each admin search — stateless, no caching needed at this scale. |
| Wrong admin password | Inline message: "Incorrect password." No lockout. |
| User clears localStorage | User can vote again. Accepted at this scale — no server-side enforcement. |

---

## Future: Realtime Updates

The architecture is Realtime-ready. To add live like/dislike/comment counts:
- Subscribe to Supabase Realtime on the `tracks` and `comments` tables in the relevant Client Components.
- Update local React state on change events.
- No changes to Server Actions, data model, or routing required.

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
ADMIN_PASSWORD
```
