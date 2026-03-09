-- Minimal safety migration for stop-completion source of truth.

alter table public.route_stops
  add column if not exists completed_at timestamptz;

notify pgrst, 'reload schema';
