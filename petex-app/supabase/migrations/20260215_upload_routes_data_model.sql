create extension if not exists pgcrypto;

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid null,
  external_ref text null,
  customer_name text null,
  phone text null,
  address text,
  raw_row jsonb null,
  zone_id uuid null references public.zones(id),
  status text not null default 'pending'
);

alter table public.shipments
  add column if not exists company_id uuid null,
  add column if not exists external_ref text null,
  add column if not exists customer_name text null,
  add column if not exists phone text null,
  add column if not exists address text,
  add column if not exists raw_row jsonb null,
  add column if not exists zone_id uuid null,
  add column if not exists status text,
  add column if not exists created_at timestamptz;

update public.shipments
set address = coalesce(address, address_raw, address_norm, city, 'Dirección pendiente'),
    customer_name = coalesce(customer_name, recipient_name),
    phone = coalesce(phone, recipient_phone),
    status = coalesce(nullif(trim(status), ''), 'pending'),
    created_at = coalesce(created_at, now())
where address is null
   or status is null
   or trim(status) = ''
   or created_at is null;

alter table public.shipments
  alter column address set not null,
  alter column status set default 'pending',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.shipments
  drop constraint if exists shipments_zone_id_fkey;
alter table public.shipments
  add constraint shipments_zone_id_fkey
  foreign key (zone_id) references public.zones(id) on delete set null;

create unique index if not exists shipments_external_ref_unique_idx
  on public.shipments (external_ref)
  where external_ref is not null;
create index if not exists shipments_zone_idx on public.shipments (zone_id);

alter table public.routes
  add column if not exists route_date date,
  add column if not exists zone_id uuid,
  add column if not exists driver_profile_id uuid,
  add column if not exists status text,
  add column if not exists created_at timestamptz;

update public.routes
set route_date = coalesce(route_date, current_date),
    status = coalesce(nullif(trim(status), ''), 'active'),
    created_at = coalesce(created_at, now())
where route_date is null
   or status is null
   or trim(status) = ''
   or created_at is null;

alter table public.routes
  alter column route_date set default current_date,
  alter column route_date set not null,
  alter column status set default 'active',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.routes
  drop constraint if exists routes_zone_id_fkey;
alter table public.routes
  add constraint routes_zone_id_fkey
  foreign key (zone_id) references public.zones(id) on delete set null;

alter table public.routes
  drop constraint if exists routes_driver_profile_id_fkey;
alter table public.routes
  add constraint routes_driver_profile_id_fkey
  foreign key (driver_profile_id) references public.profiles(id) on delete set null;

create index if not exists routes_driver_profile_date_idx on public.routes (driver_profile_id, route_date);

alter table public.route_stops
  add column if not exists route_id uuid,
  add column if not exists shipment_id uuid,
  add column if not exists stop_order int,
  add column if not exists status text,
  add column if not exists created_at timestamptz;

update public.route_stops
set status = coalesce(nullif(trim(status), ''), 'pending'),
    created_at = coalesce(created_at, now())
where status is null
   or trim(status) = ''
   or created_at is null;

alter table public.route_stops
  alter column status set default 'pending',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.route_stops
  drop constraint if exists route_stops_route_id_fkey;
alter table public.route_stops
  add constraint route_stops_route_id_fkey
  foreign key (route_id) references public.routes(id) on delete cascade;

alter table public.route_stops
  drop constraint if exists route_stops_shipment_id_fkey;
alter table public.route_stops
  add constraint route_stops_shipment_id_fkey
  foreign key (shipment_id) references public.shipments(id) on delete cascade;

create index if not exists route_stops_route_order_idx on public.route_stops (route_id, stop_order);

alter table public.zones
  add column if not exists keywords text[] not null default '{}'::text[];

alter table public.shipments enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;

drop policy if exists "shipments_admin_all" on public.shipments;
drop policy if exists "routes_admin_all" on public.routes;
drop policy if exists "routes_driver_select_own" on public.routes;
drop policy if exists "routes_driver_select_today_own" on public.routes;
drop policy if exists "route_stops_admin_all" on public.route_stops;
drop policy if exists "route_stops_driver_select_own" on public.route_stops;
drop policy if exists "route_stops_driver_select_today_own" on public.route_stops;

create policy "shipments_admin_all"
  on public.shipments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "routes_admin_all"
  on public.routes
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "routes_driver_select_own"
  on public.routes
  for select
  to authenticated
  using (driver_profile_id = auth.uid() and route_date = current_date);

create policy "route_stops_admin_all"
  on public.route_stops
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "route_stops_driver_select_own"
  on public.route_stops
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
