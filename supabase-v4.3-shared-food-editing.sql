-- Calorie Tracker v4.3 - Shared Food Editing
-- Run in Supabase SQL Editor.

begin;

alter table public.foods
  add column if not exists is_shared boolean not null default true;

update public.foods
set is_shared = true
where is_shared is distinct from true;

drop policy if exists "foods shared select" on public.foods;
drop policy if exists "foods owner insert" on public.foods;
drop policy if exists "foods owner update" on public.foods;
drop policy if exists "foods owner delete" on public.foods;
drop policy if exists "foods authenticated select" on public.foods;
drop policy if exists "foods authenticated insert" on public.foods;
drop policy if exists "foods authenticated update" on public.foods;
drop policy if exists "foods authenticated delete" on public.foods;

create policy "foods authenticated select"
on public.foods
for select
to authenticated
using (is_shared = true);

create policy "foods authenticated insert"
on public.foods
for insert
to authenticated
with check (is_shared = true);

create policy "foods authenticated update"
on public.foods
for update
to authenticated
using (is_shared = true)
with check (is_shared = true);

create policy "foods authenticated delete"
on public.foods
for delete
to authenticated
using (is_shared = true);

commit;
