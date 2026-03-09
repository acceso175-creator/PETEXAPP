-- Fix RLS ownership model using profiles.id = auth.uid() and driver ownership by routes.driver_profile_id.

alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.deliveries enable row level security;

alter table public.route_stops
  add column if not exists status text not null default 'pending',
  add column if not exists completed_at timestamptz null;

alter table public.routes
  add column if not exists completed_at timestamptz null;

create index if not exists deliveries_route_id_idx on public.deliveries (route_id);

-- Drop existing policies to avoid conflicts/duplicates, including legacy variants.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'routes'
  loop
    execute format('drop policy if exists %I on public.routes', policy_row.policyname);
  end loop;

  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'route_stops'
  loop
    execute format('drop policy if exists %I on public.route_stops', policy_row.policyname);
  end loop;

  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'deliveries'
  loop
    execute format('drop policy if exists %I on public.deliveries', policy_row.policyname);
  end loop;
end
$$;

-- Admin full access: profiles.id must match auth.uid() and role=admin.
create policy routes_admin_all
  on public.routes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Driver can read and update only own routes.
create policy routes_driver_select_own
  on public.routes
  for select
  to authenticated
  using (driver_profile_id = auth.uid());

create policy routes_driver_update_own
  on public.routes
  for update
  to authenticated
  using (driver_profile_id = auth.uid())
  with check (driver_profile_id = auth.uid());

create policy route_stops_admin_all
  on public.route_stops
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Driver can read/update only stops belonging to own routes.
create policy route_stops_driver_select_own
  on public.route_stops
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.routes r
      where r.id = route_stops.route_id
        and r.driver_profile_id = auth.uid()
    )
  );

create policy route_stops_driver_update_own
  on public.route_stops
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.routes r
      where r.id = route_stops.route_id
        and r.driver_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.routes r
      where r.id = route_stops.route_id
        and r.driver_profile_id = auth.uid()
    )
  );

create policy deliveries_admin_all
  on public.deliveries
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Driver access scoped by deliveries.route_id -> routes owned by auth.uid().
create policy deliveries_driver_select_own_route
  on public.deliveries
  for select
  to authenticated
  using (
    deliveries.route_id is not null
    and exists (
      select 1
      from public.routes r
      where r.id = deliveries.route_id
        and r.driver_profile_id = auth.uid()
    )
  );

create policy deliveries_driver_update_own_route
  on public.deliveries
  for update
  to authenticated
  using (
    deliveries.route_id is not null
    and exists (
      select 1
      from public.routes r
      where r.id = deliveries.route_id
        and r.driver_profile_id = auth.uid()
    )
  )
  with check (
    deliveries.route_id is not null
    and exists (
      select 1
      from public.routes r
      where r.id = deliveries.route_id
        and r.driver_profile_id = auth.uid()
    )
  );
