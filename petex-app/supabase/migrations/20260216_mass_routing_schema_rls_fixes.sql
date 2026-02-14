-- Fixes de esquema + RLS para ruteo masivo.

alter table public.zones
  add column if not exists color text;

update public.zones
set color = coalesce(nullif(trim(color), ''), '#6B7280')
where color is null or trim(color) = '';

alter table public.zones
  alter column color set default '#6B7280';

alter table public.route_stops
  add column if not exists title text,
  add column if not exists position int,
  add column if not exists address_text text,
  add column if not exists meta jsonb not null default '{}'::jsonb;

update public.route_stops
set title = coalesce(nullif(trim(title), ''), '')
where title is null;

alter table public.route_stops
  alter column title set default '';

alter table public.routes enable row level security;
alter table public.route_stops enable row level security;

drop policy if exists "routes_admin_all" on public.routes;
drop policy if exists "route_stops_admin_all" on public.route_stops;

create policy "routes_admin_all"
  on public.routes
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "route_stops_admin_all"
  on public.route_stops
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
