create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  driver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'assigned',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  stop_order int not null,
  recipient_name text,
  phone text,
  address text,
  city text,
  lat numeric,
  lng numeric,
  status text not null default 'pending',
  delivered_at timestamptz,
  evidence_url text,
  created_at timestamptz not null default now()
);

create index if not exists routes_driver_date_idx on public.routes(driver_id, date);
create index if not exists route_stops_route_order_idx on public.route_stops(route_id, stop_order);

alter table public.routes enable row level security;
alter table public.route_stops enable row level security;

drop policy if exists "routes_driver_select_own" on public.routes;
drop policy if exists "routes_admin_all" on public.routes;
drop policy if exists "route_stops_driver_select_own" on public.route_stops;
drop policy if exists "route_stops_admin_all" on public.route_stops;

create policy "routes_driver_select_own"
  on public.routes
  for select
  using (driver_id = auth.uid());

create policy "routes_admin_all"
  on public.routes
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "route_stops_driver_select_own"
  on public.route_stops
  for select
  using (
    exists (
      select 1
      from public.routes
      where routes.id = route_stops.route_id
        and routes.driver_id = auth.uid()
    )
  );

create policy "route_stops_admin_all"
  on public.route_stops
  for all
  using (public.is_admin())
  with check (public.is_admin());
