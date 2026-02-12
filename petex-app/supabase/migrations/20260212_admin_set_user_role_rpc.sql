do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role' and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('admin', 'driver', 'ops');
  end if;
end $$;

create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns table (id uuid, role public.user_role)
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_id uuid := auth.uid();
  requester_role public.user_role;
  normalized_role public.user_role;
begin
  if requester_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select p.role
  into requester_role
  from public.profiles p
  where p.id = requester_id;

  if requester_role is distinct from 'admin'::public.user_role then
    raise exception 'only admins can change roles' using errcode = '42501';
  end if;

  if new_role not in ('admin', 'driver', 'ops') then
    raise exception 'invalid role. allowed roles: admin, driver, ops' using errcode = '22023';
  end if;

  normalized_role := new_role::public.user_role;

  update public.profiles p
  set role = normalized_role
  where p.id = target_user_id
  returning p.id, p.role
  into id, role;

  if id is null then
    raise exception 'target user profile not found' using errcode = 'P0002';
  end if;

  return next;
end;
$$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
