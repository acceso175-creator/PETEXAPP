-- Alinea public.routes con el contrato usado por /admin/routes.
alter table public.routes
  add column if not exists driver_profile_id uuid;

-- Si existe esquema legacy, migrar valores a driver_profile_id sin sobreescribir datos ya correctos.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'routes'
      and column_name = 'driver_id'
  ) then
    execute $q$
      update public.routes
      set driver_profile_id = coalesce(driver_profile_id, driver_id)
      where driver_id is not null
    $q$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'routes'
      and column_name = 'driver_user_id'
  ) then
    execute $q$
      update public.routes
      set driver_profile_id = coalesce(driver_profile_id, driver_user_id)
      where driver_user_id is not null
    $q$;
  end if;
end
$$;

comment on column public.routes.driver_profile_id is
  'Driver asignado como profile.id (migrado desde columnas legacy driver_id/driver_user_id cuando existían).';

-- Enforzar FK e índice esperado por la UI de admin y driver.
alter table public.routes
  drop constraint if exists routes_driver_profile_id_fkey;

alter table public.routes
  add constraint routes_driver_profile_id_fkey
  foreign key (driver_profile_id) references public.profiles(id) on delete cascade;

create index if not exists routes_driver_profile_date_idx
  on public.routes (driver_profile_id, route_date);
