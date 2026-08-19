-- Calorie Tracker v4.0 - Shared catalogue migration
-- Run in Supabase SQL Editor before deploying v4.0.
-- Foods/recipes become readable by every authenticated account.
-- Only the owning account may modify/delete a catalogue row.
-- Profiles, diary entries and weight entries remain private.

begin;

alter table public.foods add column if not exists is_shared boolean not null default true;
alter table public.recipes add column if not exists is_shared boolean not null default true;
alter table public.recipe_items add column if not exists is_shared boolean not null default true;

update public.foods set is_shared=true;
update public.recipes set is_shared=true;
update public.recipe_items set is_shared=true;

-- Foods
drop policy if exists "foods own rows" on public.foods;
drop policy if exists "foods shared select" on public.foods;
drop policy if exists "foods owner insert" on public.foods;
drop policy if exists "foods owner update" on public.foods;
drop policy if exists "foods owner delete" on public.foods;
create policy "foods shared select" on public.foods for select to authenticated using (is_shared or (select auth.uid())=user_id);
create policy "foods owner insert" on public.foods for insert to authenticated with check ((select auth.uid())=user_id);
create policy "foods owner update" on public.foods for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "foods owner delete" on public.foods for delete to authenticated using ((select auth.uid())=user_id);

-- Recipes
drop policy if exists "recipes own rows" on public.recipes;
drop policy if exists "recipes shared select" on public.recipes;
drop policy if exists "recipes owner insert" on public.recipes;
drop policy if exists "recipes owner update" on public.recipes;
drop policy if exists "recipes owner delete" on public.recipes;
create policy "recipes shared select" on public.recipes for select to authenticated using (is_shared or (select auth.uid())=user_id);
create policy "recipes owner insert" on public.recipes for insert to authenticated with check ((select auth.uid())=user_id);
create policy "recipes owner update" on public.recipes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "recipes owner delete" on public.recipes for delete to authenticated using ((select auth.uid())=user_id);

-- Recipe ingredient rows
drop policy if exists "recipe items own rows" on public.recipe_items;
drop policy if exists "recipe items shared select" on public.recipe_items;
drop policy if exists "recipe items owner insert" on public.recipe_items;
drop policy if exists "recipe items owner update" on public.recipe_items;
drop policy if exists "recipe items owner delete" on public.recipe_items;
create policy "recipe items shared select" on public.recipe_items for select to authenticated using (is_shared or (select auth.uid())=user_id);
create policy "recipe items owner insert" on public.recipe_items for insert to authenticated with check ((select auth.uid())=user_id);
create policy "recipe items owner update" on public.recipe_items for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "recipe items owner delete" on public.recipe_items for delete to authenticated using ((select auth.uid())=user_id);

commit;

select count(*) as shared_foods from public.foods where is_shared=true;
select count(*) as shared_recipes from public.recipes where is_shared=true;
