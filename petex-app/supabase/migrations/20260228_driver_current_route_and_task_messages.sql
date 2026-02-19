-- Fix driver current route RPC + task_messages table for quick notes.

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
  select r.id, r.route_date, r.status, r.driver_profile_id, r.created_at
  from public.routes r
  where r.driver_profile_id = auth.uid()
    and r.status = 'active'
  order by r.route_date desc nulls last, r.created_at desc nulls last
  limit 1;
$$;

revoke all on function public.get_driver_current_route() from public;
grant execute on function public.get_driver_current_route() to authenticated;

create table if not exists public.task_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists task_messages_user_created_idx
  on public.task_messages (user_id, created_at desc);

alter table public.task_messages enable row level security;

drop policy if exists "task_messages_select_own" on public.task_messages;
drop policy if exists "task_messages_insert_own" on public.task_messages;
drop policy if exists "task_messages_delete_own" on public.task_messages;

create policy "task_messages_select_own"
  on public.task_messages
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "task_messages_insert_own"
  on public.task_messages
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "task_messages_delete_own"
  on public.task_messages
  for delete
  to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
