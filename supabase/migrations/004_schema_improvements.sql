-- Filter public track reads to active tracks only
-- (admin uses service role which bypasses RLS, so history is still accessible)
drop policy if exists "tracks_public_read" on tracks;
create policy "tracks_public_read" on tracks
  for select using (is_active = true);

-- Add length constraints on comments
alter table comments
  drop column author_name,
  add column author_name text not null check (char_length(author_name) between 1 and 100);

alter table comments
  drop column body,
  add column body text not null check (char_length(body) between 1 and 2000);

-- Add index for comment lookups by track
create index if not exists comments_track_id_idx on comments(track_id);
