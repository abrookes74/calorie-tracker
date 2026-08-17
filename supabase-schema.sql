-- Calorie Tracker v2 - Supabase schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_calorie_target numeric not null default 2000 check (daily_calorie_target > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  calories numeric not null check (calories >= 0),
  base_amount numeric not null default 100 check (base_amount > 0),
  unit text not null default 'g' check (unit in ('g','ml','item','serving')),
  serving_description text,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  servings numeric not null default 1 check (servings > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  meal_type text not null check (meal_type in ('Breakfast','Lunch','Dinner','Snacks')),
  item_type text not null check (item_type in ('food','recipe')),
  item_ref_id uuid,
  item_name text not null,
  quantity numeric not null check (quantity > 0),
  quantity_label text,
  calories numeric not null check (calories >= 0),
  created_at timestamptz not null default now()
);

create index if not exists foods_user_id_idx on public.foods(user_id);
create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipe_items_user_id_idx on public.recipe_items(user_id);
create index if not exists recipe_items_recipe_id_idx on public.recipe_items(recipe_id);
create index if not exists diary_entries_user_date_idx on public.diary_entries(user_id, entry_date);

alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.diary_entries enable row level security;

drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows" on public.profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "foods own rows" on public.foods;
create policy "foods own rows" on public.foods
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recipes own rows" on public.recipes;
create policy "recipes own rows" on public.recipes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recipe items own rows" on public.recipe_items;
create policy "recipe items own rows" on public.recipe_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "diary own rows" on public.diary_entries;
create policy "diary own rows" on public.diary_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.foods to authenticated;
grant select, insert, update, delete on public.recipes to authenticated;
grant select, insert, update, delete on public.recipe_items to authenticated;
grant select, insert, update, delete on public.diary_entries to authenticated;
