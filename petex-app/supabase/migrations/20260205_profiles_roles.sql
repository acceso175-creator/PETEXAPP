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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role public.user_role not null default 'driver',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own_without_role_change" on public.profiles;
drop policy if exists "profiles_admin_select_all" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

create policy "profiles_update_own_without_role_change"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (
      select p.role
      from public.profiles p
      where p.id = auth.uid()
    )
  );

create policy "profiles_admin_select_all"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  );
