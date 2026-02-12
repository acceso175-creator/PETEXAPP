create extension if not exists pgcrypto;

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#f97316',
  polygon_geojson jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking text not null unique,
  tracking_code text,
  external_ref text,
  status text not null default 'received',
  city text,
  address_raw text,
  address_norm text,
  recipient_name text,
  recipient_phone text,
  zone_id uuid references public.zones(id) on delete set null,
  driver_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete set null,
  tracking text not null,
  status text not null default 'pendiente',
  city text,
  address_raw text,
  address_norm text,
  recipient_name text,
  recipient_phone text,
  lat numeric,
  lng numeric,
  zone_id uuid references public.zones(id) on delete set null,
  driver_id uuid references auth.users(id) on delete set null,
  failed_reason text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists zones_name_idx on public.zones (name);
create index if not exists shipments_tracking_idx on public.shipments (tracking);
create index if not exists shipments_status_idx on public.shipments (status);
create index if not exists shipments_driver_idx on public.shipments (driver_id);
create index if not exists deliveries_tracking_idx on public.deliveries (tracking);
create index if not exists deliveries_status_idx on public.deliveries (status);
create index if not exists deliveries_driver_idx on public.deliveries (driver_id);
create index if not exists deliveries_shipment_idx on public.deliveries (shipment_id);
create index if not exists shipment_events_shipment_created_idx on public.shipment_events (shipment_id, created_at);

alter table public.zones enable row level security;
alter table public.shipments enable row level security;
alter table public.deliveries enable row level security;
alter table public.shipment_events enable row level security;

drop policy if exists "zones_admin_all" on public.zones;
create policy "zones_admin_all"
  on public.zones
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "shipments_admin_all" on public.shipments;
create policy "shipments_admin_all"
  on public.shipments
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "shipments_driver_select_own" on public.shipments;
create policy "shipments_driver_select_own"
  on public.shipments
  for select
  using (driver_id = auth.uid());

drop policy if exists "shipments_driver_update_own" on public.shipments;
create policy "shipments_driver_update_own"
  on public.shipments
  for update
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

drop policy if exists "deliveries_admin_all" on public.deliveries;
create policy "deliveries_admin_all"
  on public.deliveries
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "deliveries_driver_select_own" on public.deliveries;
create policy "deliveries_driver_select_own"
  on public.deliveries
  for select
  using (driver_id = auth.uid());

drop policy if exists "deliveries_driver_update_own" on public.deliveries;
create policy "deliveries_driver_update_own"
  on public.deliveries
  for update
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

drop policy if exists "shipment_events_admin_all" on public.shipment_events;
create policy "shipment_events_admin_all"
  on public.shipment_events
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "shipment_events_driver_select_own" on public.shipment_events;
create policy "shipment_events_driver_select_own"
  on public.shipment_events
  for select
  using (
    exists (
      select 1
      from public.shipments
      where shipments.id = shipment_events.shipment_id
        and shipments.driver_id = auth.uid()
    )
  );

drop policy if exists "shipment_events_driver_insert_own" on public.shipment_events;
create policy "shipment_events_driver_insert_own"
  on public.shipment_events
  for insert
  with check (
    exists (
      select 1
      from public.shipments
      where shipments.id = shipment_events.shipment_id
        and shipments.driver_id = auth.uid()
    )
  );
