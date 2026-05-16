-- Revoke public execute access on vote RPCs
revoke execute on function increment_likes(uuid) from public;
revoke execute on function decrement_likes(uuid) from public;
revoke execute on function increment_dislikes(uuid) from public;
revoke execute on function decrement_dislikes(uuid) from public;

-- Recreate with SECURITY DEFINER + hardened search_path
create or replace function increment_likes(track_id uuid)
returns void language sql
security definer
set search_path = ''
as $$
  update public.tracks set likes = likes + 1 where id = track_id;
$$;

create or replace function decrement_likes(track_id uuid)
returns void language sql
security definer
set search_path = ''
as $$
  update public.tracks set likes = greatest(likes - 1, 0) where id = track_id;
$$;

create or replace function increment_dislikes(track_id uuid)
returns void language sql
security definer
set search_path = ''
as $$
  update public.tracks set dislikes = dislikes + 1 where id = track_id;
$$;

create or replace function decrement_dislikes(track_id uuid)
returns void language sql
security definer
set search_path = ''
as $$
  update public.tracks set dislikes = greatest(dislikes - 1, 0) where id = track_id;
$$;
