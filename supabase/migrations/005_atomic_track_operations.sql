create or replace function set_active_track(
  p_item_type text,
  p_spotify_url text,
  p_itunes_track_name text,
  p_itunes_artist_name text,
  p_itunes_album_art_url text,
  p_itunes_preview_url text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_new_id uuid;
begin
  -- deactivate current active track
  update public.tracks
  set is_active = false, deactivated_at = now()
  where is_active = true;

  -- insert new active track and return its id
  insert into public.tracks (
    item_type, is_active, spotify_url,
    itunes_track_name, itunes_artist_name,
    itunes_album_art_url, itunes_preview_url
  ) values (
    p_item_type, true, p_spotify_url,
    p_itunes_track_name, p_itunes_artist_name,
    p_itunes_album_art_url, p_itunes_preview_url
  ) returning id into v_new_id;

  return v_new_id;
end;
$$;

create or replace function reactivate_track(p_track_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- deactivate current active track
  update public.tracks
  set is_active = false, deactivated_at = now()
  where is_active = true;

  -- reactivate the target track
  update public.tracks
  set is_active = true, deactivated_at = null
  where id = p_track_id;
end;
$$;
