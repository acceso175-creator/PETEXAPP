create table if not exists public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries (id) on delete cascade,
  actor_user_id uuid null references public.profiles (id),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.deliveries
  add column if not exists status text,
  add column if not exists failed_reason text,
  add column if not exists delivered_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.delivery_events enable row level security;
alter table public.deliveries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'deliveries' and policyname = 'deliveries_admin_all'
  ) then
    create policy deliveries_admin_all on public.deliveries
      for all
      using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ))
      with check (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;

  if exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'deliveries' and column_name = 'driver_id'
  ) and not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'deliveries' and policyname = 'deliveries_driver_update'
  ) then
    create policy deliveries_driver_update on public.deliveries
      for update
      using (driver_id = auth.uid())
      with check (driver_id = auth.uid());
  end if;

  if exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'deliveries' and column_name = 'assigned_user_id'
  ) and not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'deliveries' and policyname = 'deliveries_driver_update_assigned'
  ) then
    create policy deliveries_driver_update_assigned on public.deliveries
      for update
      using (assigned_user_id = auth.uid())
      with check (assigned_user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_events' and policyname = 'delivery_events_admin_all'
  ) then
    create policy delivery_events_admin_all on public.delivery_events
      for all
      using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ))
      with check (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ));
  end if;

  if exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'deliveries' and column_name = 'driver_id'
  ) and not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_events' and policyname = 'delivery_events_driver_insert'
  ) then
    create policy delivery_events_driver_insert on public.delivery_events
      for insert
      with check (
        exists (
          select 1
          from public.deliveries
          where deliveries.id = delivery_events.delivery_id
            and deliveries.driver_id = auth.uid()
        )
      );
  end if;

  if exists (
    select 1 from information_schema.columns where table_schema = 'public' and table_name = 'deliveries' and column_name = 'assigned_user_id'
  ) and not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'delivery_events' and policyname = 'delivery_events_driver_insert_assigned'
  ) then
    create policy delivery_events_driver_insert_assigned on public.delivery_events
      for insert
      with check (
        exists (
          select 1
          from public.deliveries
          where deliveries.id = delivery_events.delivery_id
            and deliveries.assigned_user_id = auth.uid()
        )
      );
  end if;
end $$;
