-- DRAFT: not applied. Additive tables in a separate namespace from existing meals.
-- Deliberately no client writes to subscriptions: real entitlement changes require trusted server code.
begin;
create table if not exists public.ev_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 created_at timestamptz not null default now()
);
create table if not exists public.ev_subscriptions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null default 'free' check(plan in ('free','pro')),
 status text not null default 'active' check(status in ('active','canceled')),
 updated_at timestamptz not null default now()
);
create table if not exists public.ev_favorites (
 user_id uuid not null references auth.users(id) on delete cascade,
 meal_key text not null,
 created_at timestamptz not null default now(),
 primary key(user_id,meal_key)
);
create table if not exists public.ev_meal_plans (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 day_index smallint not null check(day_index between 0 and 6),
 meal_key text not null,
 primary key(user_id,week_start,day_index)
);
create table if not exists public.ev_shopping_items (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 label text not null,
 checked boolean not null default false
);
create index if not exists ev_shopping_owner on public.ev_shopping_items(user_id,week_start);
alter table public.ev_profiles enable row level security;
alter table public.ev_subscriptions enable row level security;
alter table public.ev_favorites enable row level security;
alter table public.ev_meal_plans enable row level security;
alter table public.ev_shopping_items enable row level security;
grant select,insert,update,delete on public.ev_profiles,public.ev_favorites,public.ev_meal_plans,public.ev_shopping_items to authenticated;
grant select on public.ev_subscriptions to authenticated;
revoke insert,update,delete on public.ev_subscriptions from anon,authenticated;
create policy ev_profile_owner on public.ev_profiles for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy ev_subscription_read on public.ev_subscriptions for select to authenticated using((select auth.uid())=user_id);
-- Favorite limits need a transactional server endpoint before deployment; clients can only read/delete here.
create policy ev_favorite_read on public.ev_favorites for select to authenticated using((select auth.uid())=user_id);
create policy ev_favorite_delete on public.ev_favorites for delete to authenticated using((select auth.uid())=user_id);
create policy ev_plan_read on public.ev_meal_plans for select to authenticated using((select auth.uid())=user_id);
create policy ev_plan_write on public.ev_meal_plans for all to authenticated using((select auth.uid())=user_id and exists(select 1 from public.ev_subscriptions s where s.user_id=(select auth.uid()) and s.plan='pro' and s.status='active')) with check((select auth.uid())=user_id and exists(select 1 from public.ev_subscriptions s where s.user_id=(select auth.uid()) and s.plan='pro' and s.status='active'));
create policy ev_shopping_read on public.ev_shopping_items for select to authenticated using((select auth.uid())=user_id);
create policy ev_shopping_write on public.ev_shopping_items for all to authenticated using((select auth.uid())=user_id and exists(select 1 from public.ev_subscriptions s where s.user_id=(select auth.uid()) and s.plan='pro' and s.status='active')) with check((select auth.uid())=user_id and exists(select 1 from public.ev_subscriptions s where s.user_id=(select auth.uid()) and s.plan='pro' and s.status='active'));
commit;
