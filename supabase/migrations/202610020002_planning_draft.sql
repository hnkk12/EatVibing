-- DRAFT ONLY. Not applied. Future authenticated schema for the local premium features.
begin;
create or replace function public.ev_is_pro() returns boolean
language sql stable set search_path = public as $$
 select exists(select 1 from public.ev_subscriptions where user_id=(select auth.uid()) and plan='pro' and status='active');
$$;
create table public.ev_plan_entries (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 day_index smallint not null check(day_index between 0 and 6),
 slot text not null check(slot in ('breakfast','lunch','dinner')),
 meal_key text not null,
 servings smallint not null check(servings between 1 and 20),
 locked boolean not null default false,
 primary key(user_id,week_start,day_index,slot)
);
create table public.ev_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 people smallint not null default 2 check(people between 1 and 20),
 category text not null default 'all' check(category in ('all','loss','gain','balance')),
 avoided_ingredients text[] not null default '{}',
 cuisines text[] not null default '{}'
);
create table public.ev_saved_plans (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 80),
 payload jsonb not null,
 created_at timestamptz not null default now()
);
create table public.ev_pantry (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 ingredient_name text not null,
 quantity numeric not null check(quantity>0),
 unit text not null,
 source_text text not null
);
create table public.ev_recipe_notes (
 user_id uuid not null references auth.users(id) on delete cascade,
 meal_key text not null,
 content text not null check(char_length(content)<=3000),
 primary key(user_id,meal_key)
);
create table public.ev_collections (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 80)
);
create table public.ev_collection_items (
 collection_id uuid not null references public.ev_collections(id) on delete cascade,
 meal_key text not null,
 primary key(collection_id,meal_key)
);
create table public.ev_normalized_ingredients (
 meal_key text not null,
 line_index integer not null check(line_index>=0),
 ingredient_name text not null,
 quantity numeric,
 unit text,
 source_text text not null,
 confirmed boolean not null default false,
 primary key(meal_key,line_index)
);
-- Planner generation, Free daily limits, favorite caps, scaling and grocery aggregation
-- require transactional trusted server endpoints. Direct plan-entry writes are withheld.
alter table public.ev_plan_entries enable row level security;
grant select on public.ev_plan_entries to authenticated;
revoke insert,update,delete on public.ev_plan_entries from anon,authenticated;
create policy ev_entry_read on public.ev_plan_entries for select to authenticated using((select auth.uid())=user_id);
do $$ declare tab text; begin
 foreach tab in array array['ev_preferences','ev_saved_plans','ev_pantry','ev_recipe_notes','ev_collections'] loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('grant select,insert,update,delete on public.%I to authenticated',tab);
  execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid())=user_id)',tab||'_read',tab);
  execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid())=user_id and public.ev_is_pro()) with check ((select auth.uid())=user_id and public.ev_is_pro())',tab||'_pro_write',tab);
 end loop;
end $$;
alter table public.ev_collection_items enable row level security;
grant select on public.ev_collection_items to authenticated;
-- Membership and saving a favorite must be kept atomic by the trusted server endpoint.
revoke insert,update,delete on public.ev_collection_items from anon,authenticated;
create policy ev_collection_item_read on public.ev_collection_items for select to authenticated using(exists(select 1 from public.ev_collections c where c.id=collection_id and c.user_id=(select auth.uid())));
alter table public.ev_normalized_ingredients enable row level security;
grant select on public.ev_normalized_ingredients to anon,authenticated;
revoke insert,update,delete on public.ev_normalized_ingredients from anon,authenticated;
create policy ev_ingredient_read on public.ev_normalized_ingredients for select to anon,authenticated using(true);
commit;
