-- Estandariza conflicto por tracking_code en public.deliveries.
create unique index if not exists deliveries_tracking_code_unique_idx
  on public.deliveries (tracking_code)
  where tracking_code is not null;
