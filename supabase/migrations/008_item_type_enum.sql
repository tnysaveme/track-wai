-- Migration 008: Convert item_type from an unconstrained text column to a
-- proper Postgres enum.  An enum is the right tool here: it enforces values at
-- the type level (no runtime CHECK constraint needed), makes invalid writes
-- impossible, and communicates intent clearly in the schema.

-- Step 1: Create the enum type
CREATE TYPE public.track_item_type AS ENUM ('song', 'album');

-- Step 2: Drop the now-redundant CHECK constraint.
-- We discover the constraint name dynamically so this works regardless of how
-- Postgres auto-named it during the initial schema creation.
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.tracks'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%item_type%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.tracks DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END;
$$;

-- Step 3: Alter the column from text to the new enum type
ALTER TABLE public.tracks
  ALTER COLUMN item_type TYPE public.track_item_type
  USING item_type::public.track_item_type;

-- Step 4: Recreate set_active_track with an explicit cast from the text
-- parameter to the enum column type.  We keep the parameter as text so the
-- existing calling code (TypeScript server action) requires no changes.
CREATE OR REPLACE FUNCTION set_active_track(
  p_item_type text,
  p_spotify_url text,
  p_apple_music_url text,
  p_itunes_track_name text,
  p_itunes_artist_name text,
  p_itunes_album_art_url text,
  p_itunes_preview_url text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_new_id uuid;
BEGIN
  -- Deactivate current active track
  UPDATE public.tracks
  SET is_active = false, deactivated_at = now()
  WHERE is_active = true;

  -- Insert new active track and return its id
  INSERT INTO public.tracks (
    item_type, is_active, spotify_url, apple_music_url,
    itunes_track_name, itunes_artist_name,
    itunes_album_art_url, itunes_preview_url
  ) VALUES (
    p_item_type::public.track_item_type, true, p_spotify_url, p_apple_music_url,
    p_itunes_track_name, p_itunes_artist_name,
    p_itunes_album_art_url, p_itunes_preview_url
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
