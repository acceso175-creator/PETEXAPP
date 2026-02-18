-- Alinea tablas reales para ruteo masivo server-side.

alter table public.deliveries
  add column if not exists tracking_code text,
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists address_text text,
  add column if not exists zone_id uuid,
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table public.deliveries
  drop constraint if exists deliveries_zone_id_fkey;
alter table public.deliveries
  add constraint deliveries_zone_id_fkey
  foreign key (zone_id) references public.zones(id) on delete set null;

create unique index if not exists deliveries_tracking_code_unique_idx
  on public.deliveries (tracking_code)
  where tracking_code is not null;

alter table public.route_stops
  add column if not exists delivery_id uuid,
  add column if not exists address_text text,
  add column if not exists meta jsonb not null default '{}'::jsonb,
  add column if not exists phone text;

-- Migración best-effort de legacy shipment_id -> delivery_id.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='route_stops' and column_name='shipment_id'
  ) then
    execute $q$
      update public.route_stops
      set delivery_id = coalesce(delivery_id, shipment_id)
      where shipment_id is not null
    $q$;
  end if;
end
$$;

alter table public.route_stops
  drop constraint if exists route_stops_delivery_id_fkey;
alter table public.route_stops
  add constraint route_stops_delivery_id_fkey
  foreign key (delivery_id) references public.deliveries(id) on delete cascade;

-- Set NOT NULL solo si no quedan rows legacy huérfanas.
do $$
begin
  if not exists (select 1 from public.route_stops where delivery_id is null) then
    alter table public.route_stops alter column delivery_id set not null;
  end if;
end
$$;

notify pgrst, 'reload schema';
