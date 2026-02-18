-- Alinea upsert del importador con schema real de shipments.
create unique index if not exists shipments_tracking_code_unique_idx
  on public.shipments (tracking_code)
  where tracking_code is not null;
