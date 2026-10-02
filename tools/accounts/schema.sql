-- UK Retirement Planner accounts (intent 045). Run once in the Supabase SQL
-- editor. Accounts exist only to unlock Advanced mode: no plan figures are
-- ever stored here.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  advanced_access boolean not null default false,  -- set by the owner (friends-and-family beta, then billing)
  marketing_consent boolean not null default false, -- unticked by default at sign-up (roadmap #14)
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in user can read only their own profile.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- A signed-in user can update their own row...
drop policy if exists "update own consent" on public.profiles;
create policy "update own consent" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ...but only the consent columns. advanced_access, email and id can only be
-- changed with the service role (the Supabase dashboard).
revoke update on public.profiles from authenticated;
grant update (marketing_consent, marketing_consent_at) on public.profiles to authenticated;
grant select on public.profiles to authenticated;

-- Create the profile on sign-up, copying the consent choice the app sent in
-- the magic-link request's user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, marketing_consent, marketing_consent_at)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false)
      then coalesce((new.raw_user_meta_data ->> 'marketing_consent_at')::timestamptz, now()) end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_profile()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_profile();
