create table tracks (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('song', 'album')),
  is_active boolean not null default false,
  spotify_url text not null,
  itunes_track_name text not null,
  itunes_artist_name text not null,
  itunes_album_art_url text not null,
  itunes_preview_url text,
  likes integer not null default 0,
  dislikes integer not null default 0,
  created_at timestamptz not null default now(),
  deactivated_at timestamptz
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references tracks(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table tracks enable row level security;
alter table comments enable row level security;

create policy "tracks_public_read" on tracks for select using (true);
create policy "comments_public_read" on comments for select using (true);
create policy "comments_public_insert" on comments for insert with check (true);
