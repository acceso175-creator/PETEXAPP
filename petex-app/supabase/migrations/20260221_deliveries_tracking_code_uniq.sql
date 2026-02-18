-- 1) Detectar duplicados por tracking_code (solo informativo en ejecución de migración).
with duplicate_groups as (
  select tracking_code, count(*) as total
  from public.deliveries
  where tracking_code is not null
  group by tracking_code
  having count(*) > 1
)
select tracking_code, total
from duplicate_groups
order by total desc, tracking_code;

-- 2) Deduplicar conservando el registro más reciente por created_at (y por id como desempate).
with ranked as (
  select
    id,
    row_number() over (
      partition by tracking_code
      order by created_at desc nulls last, id desc
    ) as rn
  from public.deliveries
  where tracking_code is not null
)
delete from public.deliveries d
using ranked r
where d.id = r.id
  and r.rn > 1;

-- 3) Crear índice único para habilitar upsert por tracking_code.
create unique index if not exists deliveries_tracking_code_uniq
  on public.deliveries (tracking_code)
  where tracking_code is not null;

-- 4) Recargar schema cache de PostgREST.
notify pgrst, 'reload schema';
