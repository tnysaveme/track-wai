create or replace function increment_likes(track_id uuid)
returns void language sql as $$
  update tracks set likes = likes + 1 where id = track_id;
$$;

create or replace function decrement_likes(track_id uuid)
returns void language sql as $$
  update tracks set likes = greatest(likes - 1, 0) where id = track_id;
$$;

create or replace function increment_dislikes(track_id uuid)
returns void language sql as $$
  update tracks set dislikes = dislikes + 1 where id = track_id;
$$;

create or replace function decrement_dislikes(track_id uuid)
returns void language sql as $$
  update tracks set dislikes = greatest(dislikes - 1, 0) where id = track_id;
$$;
