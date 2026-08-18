-- Calorie Tracker v3 upgrade
-- Safe to run against the v2 database.

alter table public.foods add column if not exists category text not null default 'Other';
alter table public.foods add column if not exists favourite boolean not null default false;
alter table public.foods add column if not exists last_used_at timestamptz;

alter table public.recipes add column if not exists instructions text;
alter table public.recipes add column if not exists source_url text;
alter table public.recipes add column if not exists imported_from text;
alter table public.recipes add column if not exists external_identifier text;
alter table public.recipes add column if not exists categories text[] not null default '{}';
alter table public.recipes add column if not exists description text;
alter table public.recipes add column if not exists author_notes text;
alter table public.recipes add column if not exists imported_calories_per_serving numeric;
alter table public.recipes add column if not exists image_url text;

alter table public.recipe_items alter column food_id drop not null;
alter table public.recipe_items add column if not exists raw_text text;

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  unique(user_id, entry_date)
);

create index if not exists weight_entries_user_date_idx on public.weight_entries(user_id, entry_date);
create unique index if not exists recipes_user_external_identifier_idx
  on public.recipes(user_id, external_identifier)
  where external_identifier is not null;

alter table public.weight_entries enable row level security;
drop policy if exists "weight own rows" on public.weight_entries;
create policy "weight own rows" on public.weight_entries
for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

grant select,insert,update,delete on public.weight_entries to authenticated;


-- v3.3: imported ingredient foods may initially have unknown calories.
alter table public.foods alter column calories drop not null;
alter table public.foods add column if not exists normalized_name text;
alter table public.foods add column if not exists imported_ingredient boolean not null default false;

create index if not exists foods_user_normalized_name_idx
  on public.foods(user_id, normalized_name);

-- Existing calorie check already permits NULL values in PostgreSQL.
