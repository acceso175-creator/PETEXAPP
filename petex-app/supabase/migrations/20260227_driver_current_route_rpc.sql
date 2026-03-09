-- Driver current route should be selected by active status, not only by client-side "today".

create or replace function public.get_driver_current_route()
returns table (
  id uuid,
  route_date date,
  status text,
  driver_profile_id uuid,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with ctx as (
    select timezone('America/Chihuahua', now())::date as today_tz
  )
  select r.id, r.route_date, r.status, r.driver_profile_id, r.created_at
  from public.routes r
  cross join ctx
  where r.driver_profile_id = auth.uid()
    and coalesce(lower(r.status), '') in ('assigned', 'active', 'in_progress')
    and coalesce(r.route_date, ctx.today_tz) >= (ctx.today_tz - 1)
  order by r.route_date desc nulls last, r.created_at desc nulls last
  limit 1;
$$;

revoke all on function public.get_driver_current_route() from public;
grant execute on function public.get_driver_current_route() to authenticated;
