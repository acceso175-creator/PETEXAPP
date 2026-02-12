create extension if not exists pgcrypto;

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  driver_profile_id uuid not null references public.profiles(id) on delete cascade,
  route_date date not null default current_date,
  status text not null default 'assigned',
  created_at timestamptz not null default now()
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  stop_order int not null,
  title text,
  address text,
  lat numeric,
  lng numeric,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'routes' and column_name = 'driver_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'routes' and column_name = 'driver_profile_id'
  ) then
    alter table public.routes rename column driver_id to driver_profile_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'routes' and column_name = 'date'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'routes' and column_name = 'route_date'
  ) then
    alter table public.routes rename column date to route_date;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'route_stops' and column_name = 'recipient_name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'route_stops' and column_name = 'title'
  ) then
    alter table public.route_stops rename column recipient_name to title;
  end if;
end
$$;

alter table public.routes
  add column if not exists company_id uuid,
  add column if not exists driver_profile_id uuid,
  add column if not exists route_date date,
  add column if not exists status text,
  add column if not exists created_at timestamptz;

alter table public.route_stops
  add column if not exists route_id uuid,
  add column if not exists stop_order int,
  add column if not exists title text,
  add column if not exists address text,
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists status text,
  add column if not exists created_at timestamptz;

update public.routes
set route_date = coalesce(route_date, current_date),
    status = coalesce(nullif(trim(status), ''), 'assigned'),
    created_at = coalesce(created_at, now())
where route_date is null
   or status is null
   or trim(status) = ''
   or created_at is null;

update public.route_stops
set stop_order = coalesce(stop_order, 1),
    status = coalesce(nullif(trim(status), ''), 'pending'),
    created_at = coalesce(created_at, now())
where stop_order is null
   or status is null
   or trim(status) = ''
   or created_at is null;

alter table public.routes
  alter column driver_profile_id set not null,
  alter column route_date set not null,
  alter column status set default 'assigned',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.route_stops
  alter column route_id set not null,
  alter column stop_order set not null,
  alter column status set default 'pending',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.routes
  drop constraint if exists routes_driver_profile_id_fkey;
alter table public.routes
  add constraint routes_driver_profile_id_fkey
  foreign key (driver_profile_id) references public.profiles(id) on delete cascade;

alter table public.route_stops
  drop constraint if exists route_stops_route_id_fkey;
alter table public.route_stops
  add constraint route_stops_route_id_fkey
  foreign key (route_id) references public.routes(id) on delete cascade;

drop index if exists routes_driver_date_idx;
create index if not exists routes_driver_profile_date_idx on public.routes (driver_profile_id, route_date);
create index if not exists route_stops_route_order_idx on public.route_stops (route_id, stop_order);

alter table public.routes enable row level security;
alter table public.route_stops enable row level security;

drop policy if exists "routes_driver_select_own" on public.routes;
drop policy if exists "routes_admin_all" on public.routes;
drop policy if exists "route_stops_driver_select_own" on public.route_stops;
drop policy if exists "route_stops_admin_all" on public.route_stops;

create policy "routes_admin_all"
  on public.routes
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "routes_driver_select_today_own"
  on public.routes
  for select
  using (driver_profile_id = auth.uid() and route_date = current_date);

create policy "route_stops_admin_all"
  on public.route_stops
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "route_stops_driver_select_today_own"
  on public.route_stops
  for select
  using (
    exists (
      select 1
      from public.routes
      where routes.id = route_stops.route_id
        and routes.driver_profile_id = auth.uid()
        and routes.route_date = current_date
    )
  );
