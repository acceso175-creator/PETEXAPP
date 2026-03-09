-- Ensure route stop completion fields + correct RLS ownership model using profiles.id = auth.uid().

alter table public.routes enable row level security;
alter table public.route_stops enable row level security;

alter table public.route_stops
  add column if not exists completed_at timestamptz,
  add column if not exists completed boolean not null default false;

update public.route_stops
set completed = true
where completed_at is not null
  and completed = false;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "routes_select_driver_own" on public.routes;
drop policy if exists "route_stops_select_driver_own" on public.route_stops;
drop policy if exists "route_stops_update_driver_own" on public.route_stops;

create policy "routes_select_driver_own"
on public.routes
for select
to authenticated
using (
  public.is_admin()
  or driver_profile_id = auth.uid()
);

create policy "route_stops_select_driver_own"
on public.route_stops
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.routes r
    where r.id = route_stops.route_id
      and r.driver_profile_id = auth.uid()
  )
);

create policy "route_stops_update_driver_own"
on public.route_stops
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.routes r
    where r.id = route_stops.route_id
      and r.driver_profile_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.routes r
    where r.id = route_stops.route_id
      and r.driver_profile_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
