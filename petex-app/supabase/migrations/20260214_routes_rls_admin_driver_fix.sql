-- Fix RLS para permitir CRUD de admin y lectura de rutas propias para drivers.
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;

drop policy if exists "routes_admin_all" on public.routes;
drop policy if exists "routes_driver_select_own" on public.routes;
drop policy if exists "routes_driver_select_today_own" on public.routes;

drop policy if exists "route_stops_admin_all" on public.route_stops;
drop policy if exists "route_stops_driver_select_own" on public.route_stops;
drop policy if exists "route_stops_driver_select_today_own" on public.route_stops;

create policy "routes_admin_all"
  on public.routes
  as permissive
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "routes_driver_select_own"
  on public.routes
  as permissive
  for select
  to authenticated
  using (driver_profile_id = auth.uid());

create policy "route_stops_admin_all"
  on public.route_stops
  as permissive
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "route_stops_driver_select_own"
  on public.route_stops
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.routes
      where routes.id = route_stops.route_id
        and routes.driver_profile_id = auth.uid()
    )
  );
