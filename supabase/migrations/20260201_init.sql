-- Initial schema for nutrition-beta
begin;

create extension if not exists "pgcrypto";

-- Idempotent column fixes for existing tables
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'training_plans') then
    alter table public.training_plans
      add column if not exists client_id uuid,
      add column if not exists coach_id uuid,
      add column if not exists name text,
      add column if not exists status text,
      add column if not exists notes text,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'training_blocks') then
    alter table public.training_blocks
      add column if not exists plan_id uuid,
      add column if not exists client_id uuid,
      add column if not exists title text,
      add column if not exists "order" int,
      add column if not exists weeks int,
      add column if not exists goal text,
      add column if not exists notes text,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'training_sessions') then
    alter table public.training_sessions
      add column if not exists plan_id uuid,
      add column if not exists block_id uuid,
      add column if not exists client_id uuid,
      add column if not exists block_title text,
      add column if not exists session_order int,
      add column if not exists session_label text,
      add column if not exists focus text,
      add column if not exists notes text,
      add column if not exists exercises jsonb,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'workout_logs') then
    alter table public.workout_logs
      add column if not exists client_id uuid,
      add column if not exists plan_id uuid,
      add column if not exists session_id uuid,
      add column if not exists session_order int,
      add column if not exists exercise_id text,
      add column if not exists exercise_name text,
      add column if not exists sets int,
      add column if not exists reps int,
      add column if not exists load numeric,
      add column if not exists rpe numeric,
      add column if not exists notes text,
      add column if not exists date date,
      add column if not exists completed_at timestamptz,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'macro_targets') then
    alter table public.macro_targets
      add column if not exists client_id uuid,
      add column if not exists date date,
      add column if not exists kcal numeric,
      add column if not exists p numeric,
      add column if not exists c numeric,
      add column if not exists f numeric,
      add column if not exists fiber numeric,
      add column if not exists notes text,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'food_logs') then
    alter table public.food_logs
      add column if not exists client_id uuid,
      add column if not exists date date,
      add column if not exists meal_key text,
      add column if not exists food_id text,
      add column if not exists qty numeric,
      add column if not exists unit text,
      add column if not exists kcal numeric,
      add column if not exists p numeric,
      add column if not exists c numeric,
      add column if not exists f numeric,
      add column if not exists fiber numeric,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'foods') then
    alter table public.foods
      add column if not exists is_public boolean,
      add column if not exists owner_id uuid,
      add column if not exists food_name text,
      add column if not exists unit text,
      add column if not exists kcal numeric,
      add column if not exists p numeric,
      add column if not exists c numeric,
      add column if not exists f numeric,
      add column if not exists fiber numeric,
      add column if not exists type text,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'exercises') then
    alter table public.exercises
      add column if not exists is_public boolean,
      add column if not exists owner_id uuid,
      add column if not exists name text,
      add column if not exists category text,
      add column if not exists muscles text[],
      add column if not exists equipment text,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'macro_split_templates') then
    alter table public.macro_split_templates
      add column if not exists name text,
      add column if not exists goal text,
      add column if not exists meals_count int,
      add column if not exists split jsonb,
      add column if not exists created_by uuid,
      add column if not exists is_public boolean,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'training_templates') then
    alter table public.training_templates
      add column if not exists title text,
      add column if not exists goal text,
      add column if not exists level text,
      add column if not exists equipment text,
      add column if not exists frequency int,
      add column if not exists description text,
      add column if not exists created_by uuid,
      add column if not exists is_public boolean,
      add column if not exists payload jsonb,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'checkins') then
    alter table public.checkins
      add column if not exists client_id uuid,
      add column if not exists week_start date,
      add column if not exists weight numeric,
      add column if not exists waist numeric,
      add column if not exists sleep numeric,
      add column if not exists steps int,
      add column if not exists stress int,
      add column if not exists hunger int,
      add column if not exists energy int,
      add column if not exists performance int,
      add column if not exists notes text,
      add column if not exists created_at timestamptz,
      add column if not exists updated_at timestamptz;
  end if;
end;
$$;

-- Helpers
drop function if exists public.is_coach_of(uuid) cascade;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'coach'
  );
$$;

create or replace function public.is_coach_of(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.coach_clients
    where coach_id = auth.uid()
      and client_id = target_id
      and status = 'active'
  );
$$;

create or replace function public.has_client_access(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_id or public.is_admin() or public.is_coach_of(target_id);
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('client','coach','admin')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Coach clients
create table if not exists public.coach_clients (
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  primary key (coach_id, client_id)
);

-- Foods
create table if not exists public.foods (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  owner_id uuid references public.profiles(id) on delete set null,
  is_public boolean not null default false,
  food_name text not null,
  unit text not null,
  kcal numeric not null default 0,
  p numeric not null default 0,
  c numeric not null default 0,
  f numeric not null default 0,
  fiber numeric not null default 0,
  type text not null check (type in ('mixed','protein','carb','fat')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.foods
  add column if not exists kcal numeric not null default 0,
  add column if not exists p numeric not null default 0,
  add column if not exists c numeric not null default 0,
  add column if not exists f numeric not null default 0,
  add column if not exists fiber numeric not null default 0,
  add column if not exists type text not null default 'mixed';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'foods_type_check'
  ) then
    alter table public.foods
      add constraint foods_type_check check (type in ('mixed','protein','carb','fat'));
  end if;
end;
$$;

drop trigger if exists set_foods_updated_at on public.foods;
create trigger set_foods_updated_at
before update on public.foods
for each row execute function public.set_updated_at();

-- Macro targets
create table if not exists public.macro_targets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  kcal numeric not null default 0,
  p numeric not null default 0,
  c numeric not null default 0,
  f numeric not null default 0,
  fiber numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, date)
);

create index if not exists macro_targets_client_date_idx on public.macro_targets (client_id, date);

drop trigger if exists set_macro_targets_updated_at on public.macro_targets;
create trigger set_macro_targets_updated_at
before update on public.macro_targets
for each row execute function public.set_updated_at();

-- Macro split templates
create table if not exists public.macro_split_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text check (goal in ('maint','cut','bulk')),
  meals_count int not null default 3,
  split jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_macro_split_templates_updated_at on public.macro_split_templates;
create trigger set_macro_split_templates_updated_at
before update on public.macro_split_templates
for each row execute function public.set_updated_at();

create table if not exists public.client_macro_splits (
  client_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.macro_split_templates(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (client_id, template_id)
);

-- Food logs
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  meal_key text not null,
  food_id text not null references public.foods(id) on delete restrict,
  qty numeric not null default 0,
  unit text not null,
  kcal numeric not null default 0,
  p numeric not null default 0,
  c numeric not null default 0,
  f numeric not null default 0,
  fiber numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_logs_client_date_idx on public.food_logs (client_id, date);

drop trigger if exists set_food_logs_updated_at on public.food_logs;
create trigger set_food_logs_updated_at
before update on public.food_logs
for each row execute function public.set_updated_at();

-- Training plans
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_plans_client_idx on public.training_plans (client_id);

drop trigger if exists set_training_plans_updated_at on public.training_plans;
create trigger set_training_plans_updated_at
before update on public.training_plans
for each row execute function public.set_updated_at();

-- Training blocks
create table if not exists public.training_blocks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  "order" int not null default 1,
  weeks int not null default 1,
  goal text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_blocks_plan_idx on public.training_blocks (plan_id);

drop trigger if exists set_training_blocks_updated_at on public.training_blocks;
create trigger set_training_blocks_updated_at
before update on public.training_blocks
for each row execute function public.set_updated_at();

-- Training sessions
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  block_id uuid not null references public.training_blocks(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  block_title text,
  session_order int not null default 1,
  session_label text,
  focus text,
  notes text,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_sessions_plan_idx on public.training_sessions (plan_id);
create index if not exists training_sessions_block_idx on public.training_sessions (block_id);

drop trigger if exists set_training_sessions_updated_at on public.training_sessions;
create trigger set_training_sessions_updated_at
before update on public.training_sessions
for each row execute function public.set_updated_at();

-- Exercises
create table if not exists public.exercises (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  owner_id uuid references public.profiles(id) on delete set null,
  is_public boolean not null default false,
  name text not null,
  category text not null check (category in ('pull','push','legs','core','full')),
  muscles text[] not null default '{}',
  equipment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_exercises_updated_at on public.exercises;
create trigger set_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

-- Workout logs
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.training_plans(id) on delete set null,
  session_id uuid references public.training_sessions(id) on delete set null,
  session_order int,
  exercise_id text,
  exercise_name text,
  sets int not null default 0,
  reps int not null default 0,
  load numeric not null default 0,
  rpe numeric,
  notes text,
  date date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_logs_client_date_idx on public.workout_logs (client_id, date);
create index if not exists workout_logs_client_plan_idx on public.workout_logs (client_id, plan_id);

drop trigger if exists set_workout_logs_updated_at on public.workout_logs;
create trigger set_workout_logs_updated_at
before update on public.workout_logs
for each row execute function public.set_updated_at();

-- Training templates
create table if not exists public.training_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  goal text,
  level text,
  equipment text,
  frequency int,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  is_public boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_training_templates_updated_at on public.training_templates;
create trigger set_training_templates_updated_at
before update on public.training_templates
for each row execute function public.set_updated_at();

-- Check-ins
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  weight numeric,
  waist numeric,
  sleep numeric,
  steps int,
  stress int,
  hunger int,
  energy int,
  performance int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, week_start)
);

drop trigger if exists set_checkins_updated_at on public.checkins;
create trigger set_checkins_updated_at
before update on public.checkins
for each row execute function public.set_updated_at();

-- Auth trigger for profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
  display_name_value text;
begin
  selected_role := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  if selected_role not in ('client','coach','admin') then
    selected_role := 'client';
  end if;

  display_name_value := coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name');

  insert into public.profiles (id, email, role, display_name)
  values (new.id, new.email, selected_role, display_name_value)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.coach_clients enable row level security;
alter table public.foods enable row level security;
alter table public.macro_targets enable row level security;
alter table public.macro_split_templates enable row level security;
alter table public.client_macro_splits enable row level security;
alter table public.food_logs enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_blocks enable row level security;
alter table public.training_sessions enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.training_templates enable row level security;
alter table public.checkins enable row level security;

-- Policies: profiles
drop policy if exists "profiles_read_own_or_admin_or_coach" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_read_own_or_admin_or_coach" on public.profiles
  for select
  using (
    id = auth.uid()
    or public.is_admin()
    or public.is_coach_of(id)
  );

create policy "profiles_insert_self" on public.profiles
  for insert
  with check (
    id = auth.uid()
    and role in ('client','coach')
  );

create policy "profiles_update_self_or_admin" on public.profiles
  for update
  using (
    id = auth.uid() or public.is_admin()
  )
  with check (
    id = auth.uid() or public.is_admin()
  );

create policy "profiles_delete_admin" on public.profiles
  for delete
  using (public.is_admin());

-- Policies: coach_clients
drop policy if exists "coach_clients_read" on public.coach_clients;
drop policy if exists "coach_clients_insert" on public.coach_clients;
drop policy if exists "coach_clients_update" on public.coach_clients;
drop policy if exists "coach_clients_delete" on public.coach_clients;
create policy "coach_clients_read" on public.coach_clients
  for select
  using (
    coach_id = auth.uid()
    or client_id = auth.uid()
    or public.is_admin()
  );

create policy "coach_clients_insert" on public.coach_clients
  for insert
  with check (
    coach_id = auth.uid() or public.is_admin()
  );

create policy "coach_clients_update" on public.coach_clients
  for update
  using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid() or public.is_admin());

create policy "coach_clients_delete" on public.coach_clients
  for delete
  using (coach_id = auth.uid() or public.is_admin());

-- Policies: foods
drop policy if exists "foods_read" on public.foods;
drop policy if exists "foods_insert" on public.foods;
drop policy if exists "foods_update" on public.foods;
drop policy if exists "foods_delete" on public.foods;
create policy "foods_read" on public.foods
  for select
  using (
    is_public
    or owner_id = auth.uid()
    or public.is_admin()
    or public.is_coach_of(owner_id)
  );

create policy "foods_insert" on public.foods
  for insert
  with check (
    owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id)
  );

create policy "foods_update" on public.foods
  for update
  using (owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id))
  with check (owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id));

create policy "foods_delete" on public.foods
  for delete
  using (owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id));

-- Policies: macro_targets
drop policy if exists "macro_targets_access" on public.macro_targets;
create policy "macro_targets_access" on public.macro_targets
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- Policies: macro_split_templates
drop policy if exists "macro_split_templates_read" on public.macro_split_templates;
drop policy if exists "macro_split_templates_insert" on public.macro_split_templates;
drop policy if exists "macro_split_templates_update" on public.macro_split_templates;
drop policy if exists "macro_split_templates_delete" on public.macro_split_templates;
create policy "macro_split_templates_read" on public.macro_split_templates
  for select
  using (
    is_public
    or created_by = auth.uid()
    or public.is_admin()
  );

create policy "macro_split_templates_insert" on public.macro_split_templates
  for insert
  with check (
    (public.is_admin() or public.is_coach())
    and created_by = auth.uid()
  );

create policy "macro_split_templates_update" on public.macro_split_templates
  for update
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "macro_split_templates_delete" on public.macro_split_templates
  for delete
  using (created_by = auth.uid() or public.is_admin());

-- Policies: client_macro_splits
drop policy if exists "client_macro_splits_access" on public.client_macro_splits;
create policy "client_macro_splits_access" on public.client_macro_splits
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- Policies: food_logs
drop policy if exists "food_logs_access" on public.food_logs;
create policy "food_logs_access" on public.food_logs
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- Policies: training_plans
drop policy if exists "training_plans_access" on public.training_plans;
create policy "training_plans_access" on public.training_plans
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- Policies: training_blocks
drop policy if exists "training_blocks_access" on public.training_blocks;
create policy "training_blocks_access" on public.training_blocks
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- Policies: training_sessions
drop policy if exists "training_sessions_access" on public.training_sessions;
create policy "training_sessions_access" on public.training_sessions
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- Policies: exercises
drop policy if exists "exercises_read" on public.exercises;
drop policy if exists "exercises_insert" on public.exercises;
drop policy if exists "exercises_update" on public.exercises;
drop policy if exists "exercises_delete" on public.exercises;
create policy "exercises_read" on public.exercises
  for select
  using (
    is_public
    or owner_id = auth.uid()
    or public.is_admin()
    or public.is_coach_of(owner_id)
  );

create policy "exercises_insert" on public.exercises
  for insert
  with check (
    owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id)
  );

create policy "exercises_update" on public.exercises
  for update
  using (owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id))
  with check (owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id));

create policy "exercises_delete" on public.exercises
  for delete
  using (owner_id = auth.uid() or public.is_admin() or public.is_coach_of(owner_id));

-- Policies: workout_logs
drop policy if exists "workout_logs_access" on public.workout_logs;
create policy "workout_logs_access" on public.workout_logs
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

-- Policies: training_templates
drop policy if exists "training_templates_read" on public.training_templates;
drop policy if exists "training_templates_insert" on public.training_templates;
drop policy if exists "training_templates_update" on public.training_templates;
drop policy if exists "training_templates_delete" on public.training_templates;
create policy "training_templates_read" on public.training_templates
  for select
  using (
    is_public
    or created_by = auth.uid()
    or public.is_admin()
  );

create policy "training_templates_insert" on public.training_templates
  for insert
  with check (
    (public.is_admin() or public.is_coach())
    and created_by = auth.uid()
  );

create policy "training_templates_update" on public.training_templates
  for update
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "training_templates_delete" on public.training_templates
  for delete
  using (created_by = auth.uid() or public.is_admin());

-- Policies: checkins
drop policy if exists "checkins_access" on public.checkins;
create policy "checkins_access" on public.checkins
  for all
  using (public.has_client_access(client_id))
  with check (public.has_client_access(client_id));

commit;
