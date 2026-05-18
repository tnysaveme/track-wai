create table track_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table track_events enable row level security;

-- Anon can read all events — INSERT events on visible rows are always delivered
create policy "track_events_public_read" on track_events
  for select using (true);

alter publication supabase_realtime add table track_events;
