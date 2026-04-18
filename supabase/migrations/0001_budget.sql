-- OurLife Phase 2: shared household budget & expenses
-- Run this in Supabase SQL Editor (or supabase db push).
-- After applying, generate types:
--   npx supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/lib/supabase/database.types.ts

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  primary key (household_id, user_id)
);

create unique index household_members_one_household_per_user
  on public.household_members (user_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  icon text not null default 'Circle',
  color text not null default '#64748b',
  monthly_budget numeric(12, 2) not null default 0 check (monthly_budget >= 0),
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create index categories_household_id_idx on public.categories (household_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  paid_by_user_id uuid not null references auth.users (id),
  amount numeric(12, 2) not null check (amount >= 0),
  description text,
  date date not null default (timezone ('utc', now())::date),
  created_at timestamptz not null default now()
);

create index expenses_household_id_idx on public.expenses (household_id);
create index expenses_date_idx on public.expenses (date desc);
create index expenses_category_id_idx on public.expenses (category_id);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  code text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users (id),
  unique (code)
);

create index household_invites_household_id_idx on public.household_invites (household_id);

-- -----------------------------------------------------------------------------
-- Helper: household membership (for RLS)
-- -----------------------------------------------------------------------------

create or replace function public.is_household_member (_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = _household_id
      and hm.user_id = (select auth.uid ())
  );
$$;

comment on function public.is_household_member (uuid) is
  'True if auth.uid() is a member of the given household (use in RLS policies).';

create or replace function public.is_household_admin (_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = _household_id
      and hm.user_id = (select auth.uid ())
      and hm.role = 'admin'
  );
$$;

-- Paid-by must be someone in the household
create or replace function public.is_member_of_same_household (
  _household_id uuid,
  _user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = _household_id
      and hm.user_id = _user_id
  );
$$;

-- -----------------------------------------------------------------------------
-- Seed default categories when a household is created
-- -----------------------------------------------------------------------------

create or replace function public.trg_seed_default_categories ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (household_id, name, icon, color, monthly_budget)
  values
    (new.id, 'Groceries', 'ShoppingCart', '#22c55e', 0),
    (new.id, 'Rent', 'Home', '#6366f1', 0),
    (new.id, 'Utilities', 'Zap', '#eab308', 0),
    (new.id, 'Dining Out', 'UtensilsCrossed', '#f97316', 0),
    (new.id, 'Transport', 'Car', '#3b82f6', 0),
    (new.id, 'Entertainment', 'Ticket', '#ec4899', 0),
    (new.id, 'Other', 'Circle', '#64748b', 0);
  return new;
end;
$$;

create trigger households_seed_categories
  after insert on public.households
  for each row
  execute function public.trg_seed_default_categories ();

-- -----------------------------------------------------------------------------
-- RPC: create household (caller becomes admin)
-- -----------------------------------------------------------------------------

create or replace function public.create_household (p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid ();
  v_household_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'Household name required';
  end if;

  if exists (select 1 from public.household_members hm where hm.user_id = v_uid) then
    raise exception 'You already belong to a household';
  end if;

  insert into public.households (name)
  values (trim(p_name))
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'admin');

  return v_household_id;
end;
$$;

grant execute on function public.create_household (text) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: generate invite (admin only) — 8-char code, 7 days, single-use
-- -----------------------------------------------------------------------------

create or replace function public.generate_household_invite (p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid ();
  v_code text;
  attempts int := 0;
  pos int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_household_admin (p_household_id) then
    raise exception 'Only household admins can create invites';
  end if;

  -- Alphanumeric (no ambiguous chars), length 8
  loop
    v_code := '';
    for pos in 1..8 loop
      v_code := v_code || substr(
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
        1 + floor(random () * 32)::int,
        1
      );
    end loop;
    exit when not exists (
      select 1
      from public.household_invites hi
      where hi.code = v_code
    );
    attempts := attempts + 1;
    if attempts > 20 then
      raise exception 'Could not generate unique code';
    end if;
  end loop;

  insert into public.household_invites (
    household_id,
    code,
    created_by,
    expires_at
  )
  values (
    p_household_id,
    v_code,
    v_uid,
    now () + interval '7 days'
  );

  return v_code;
end;
$$;

grant execute on function public.generate_household_invite (uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: redeem invite code (caller becomes member; single-use)
-- -----------------------------------------------------------------------------

create or replace function public.accept_household_invite (p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid ();
  v_inv record;
  v_household_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.household_members hm where hm.user_id = v_uid) then
    raise exception 'You already belong to a household';
  end if;

  if p_code is null or trim(p_code) = '' then
    raise exception 'Invite code required';
  end if;

  select hi.*
  into v_inv
  from public.household_invites hi
  where hi.code = upper(trim(p_code))
    and hi.used_at is null
    and hi.expires_at > now ()
  for update;

  if v_inv.id is null then
    raise exception 'Invalid or expired invite code';
  end if;

  v_household_id := v_inv.household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'member');

  update public.household_invites
  set
    used_at = now (),
    used_by = v_uid
  where id = v_inv.id;

  return v_household_id;
end;
$$;

grant execute on function public.accept_household_invite (text) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.household_invites enable row level security;

-- households
create policy "households_select_member"
  on public.households for select
  using (public.is_household_member (id));

create policy "households_update_admin"
  on public.households for update
  using (public.is_household_admin (id))
  with check (public.is_household_admin (id));

-- household_members
create policy "household_members_select_member"
  on public.household_members for select
  using (public.is_household_member (household_id));

-- No direct insert/delete for authenticated — use RPC only
-- (Trigger and SECURITY DEFINER functions run as owner and bypass RLS.)

-- categories
create policy "categories_select_member"
  on public.categories for select
  using (public.is_household_member (household_id));

create policy "categories_insert_member"
  on public.categories for insert
  with check (public.is_household_member (household_id));

create policy "categories_update_member"
  on public.categories for update
  using (public.is_household_member (household_id))
  with check (public.is_household_member (household_id));

create policy "categories_delete_member"
  on public.categories for delete
  using (public.is_household_member (household_id));

-- expenses
create policy "expenses_select_member"
  on public.expenses for select
  using (public.is_household_member (household_id));

create policy "expenses_insert_member"
  on public.expenses for insert
  with check (
    public.is_household_member (household_id)
    and public.is_member_of_same_household (household_id, paid_by_user_id)
    and exists (
      select 1
      from public.categories c
      where c.id = category_id
        and c.household_id = household_id
    )
  );

create policy "expenses_update_member"
  on public.expenses for update
  using (public.is_household_member (household_id))
  with check (
    public.is_household_member (household_id)
    and public.is_member_of_same_household (household_id, paid_by_user_id)
    and exists (
      select 1
      from public.categories c
      where c.id = category_id
        and c.household_id = household_id
    )
  );

create policy "expenses_delete_member"
  on public.expenses for delete
  using (public.is_household_member (household_id));

-- invites: members can read invites for their household
create policy "invites_select_member"
  on public.household_invites for select
  using (public.is_household_member (household_id));

-- Inserts only via generate_household_invite (SECURITY DEFINER)
create policy "invites_no_direct_insert"
  on public.household_invites for insert
  with check (false);

create policy "invites_update_system"
  on public.household_invites for update
  using (false);

-- accept_household_invite updates via SECURITY DEFINER (bypasses RLS)

comment on table public.households is 'Shared household for a couple.';
comment on table public.household_invites is 'Single-use invite codes (7-day expiry); created via generate_household_invite.';
