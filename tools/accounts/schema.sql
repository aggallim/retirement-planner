-- UK Retirement Planner accounts (intents 045 and 063). Run in the Supabase
-- SQL editor; safe to re-run. Accounts exist only to unlock Advanced mode: no
-- plan figures are ever stored here.

-- Owner-only tables and views live in a schema the REST API doesn't expose.
-- Read them in the SQL editor or the Table Editor (schema: private).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  advanced_access boolean not null default false,  -- granted by an invite (beta), later by billing
  marketing_consent boolean not null default false, -- unticked by default at sign-up (roadmap #14)
  marketing_consent_at timestamptz,                 -- server time, set by trigger (intent 063)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Intent 063: consent counts only once the address is confirmed; record the
-- wording shown; give each profile an unsubscribe link.
alter table public.profiles add column if not exists marketing_consent_pending boolean not null default false;
alter table public.profiles add column if not exists consent_text_version text;
alter table public.profiles add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists profiles_unsubscribe_token on public.profiles (unsubscribe_token);

alter table public.profiles enable row level security;

-- A signed-in user can read only their own profile. auth.uid() is wrapped in
-- a select so it runs once per query, not per row (performance advisor).
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using ((select auth.uid()) = id);

-- A signed-in user can update their own row...
drop policy if exists "update own consent" on public.profiles;
create policy "update own consent" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ...but only the consent columns. advanced_access, email and id can only be
-- changed with the service role (the Supabase dashboard). marketing_consent_at
-- stays writable so older app versions don't fail, but the trigger below
-- replaces whatever the browser sends with the server time.
revoke update on public.profiles from authenticated;
grant update (marketing_consent, marketing_consent_at, consent_text_version) on public.profiles to authenticated;
grant select on public.profiles to authenticated;

-- ---------------------------------------------------------------- invites
-- Invite-only sign-up (intent 063, privacy finding F4). Supabase refuses to
-- create an account for an address that isn't here, so no email is sent to
-- it. Being invited also grants advanced_access. To add a tester:
--   insert into private.beta_invites (email, note) values (lower('them@example.com'), 'who');
create table if not exists private.beta_invites (
  email text primary key check (email = lower(email)),
  note text,
  invited_at timestamptz not null default now()
);

-- Everyone who already has an account stays able to sign in.
insert into private.beta_invites (email, note)
select lower(email), 'had an account before the invite gate' from auth.users
 where email is not null
on conflict (email) do nothing;

create or replace function private.enforce_beta_invite()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or not exists (select 1 from private.beta_invites i where i.email = lower(new.email)) then
    raise exception 'invite_only' using hint = 'Sign-up is invite-only during the beta.';
  end if;
  return new;
end;
$$;

create or replace trigger before_auth_user_created
  before insert on auth.users
  for each row execute function private.enforce_beta_invite();

-- Inviting someone who already has an account unlocks Advanced for them too.
create or replace function private.grant_invited_access()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set advanced_access = true
   where lower(email) = new.email and not advanced_access;
  return new;
end;
$$;

create or replace trigger beta_invites_grant
  after insert on private.beta_invites
  for each row execute function private.grant_invited_access();

-- ------------------------------------------------- consent and suppression
-- Every consent change, append-only (F8). Rows go when the account is deleted.
create table if not exists private.consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  marketing_consent boolean not null,
  pending boolean not null default false,  -- box ticked, address not yet confirmed
  consent_text_version text,
  source text not null,
  created_at timestamptz not null default now()
);
create index if not exists consent_events_user_id on private.consent_events (user_id);

create or replace function private.consent_events_append_only()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'consent_events is append-only';
end;
$$;

create or replace trigger consent_events_no_update
  before update on private.consent_events
  for each row execute function private.consent_events_append_only();

-- Do-not-email list: unsubscribes, and deleted accounts that had opted in.
create table if not exists private.marketing_suppressions (
  email text primary key check (email = lower(email)),
  reason text not null check (reason in ('unsubscribed', 'account deleted', 'owner')),
  created_at timestamptz not null default now()
);

-- The consent time comes from the server clock, never the browser.
create or replace function private.stamp_consent()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.marketing_consent is distinct from old.marketing_consent then
    new.marketing_consent_at := case when new.marketing_consent then now() end;
  else
    new.marketing_consent_at := old.marketing_consent_at;
  end if;
  if new.marketing_consent then
    new.marketing_consent_pending := false;
  end if;
  new.consent_text_version := left(new.consent_text_version, 40);
  return new;
end;
$$;

create or replace trigger profiles_consent_stamp
  before insert or update on public.profiles
  for each row execute function private.stamp_consent();

-- Log each change. The source is set by the function making it; otherwise
-- it is the account panel (a signed-in user) or the owner.
create or replace function private.log_consent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.marketing_consent is distinct from old.marketing_consent then
    insert into private.consent_events (user_id, email, marketing_consent, pending, consent_text_version, source)
    values (
      new.id, new.email, new.marketing_consent, new.marketing_consent_pending, new.consent_text_version,
      coalesce(nullif(current_setting('app.consent_source', true), ''),
        case when (select auth.role()) = 'authenticated' then 'account panel' else 'owner' end)
    );
    -- A new, confirmed opt-in is a newer choice than an old unsubscribe.
    if new.marketing_consent then
      delete from private.marketing_suppressions where email = lower(new.email);
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger profiles_consent_log
  after insert or update on public.profiles
  for each row execute function private.log_consent();

-- Deleting an account that had opted in keeps the address on the
-- do-not-email list, whichever way it was deleted.
create or replace function private.suppress_on_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.marketing_consent then
    insert into private.marketing_suppressions (email, reason)
    values (lower(old.email), 'account deleted')
    on conflict (email) do nothing;
  end if;
  return old;
end;
$$;

create or replace trigger profiles_suppress_on_delete
  before delete on public.profiles
  for each row execute function private.suppress_on_delete();

-- ---------------------------------------------------------- new accounts
-- Create the profile on sign-up. A ticked marketing box is held as pending
-- until the address is confirmed (F4).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  wants boolean := coalesce(new.raw_user_meta_data ->> 'marketing_consent', '') = 'true';
  confirmed boolean := new.email_confirmed_at is not null;
begin
  perform set_config('app.consent_source', 'sign-up', true);
  insert into public.profiles (id, email, advanced_access, marketing_consent, marketing_consent_pending, consent_text_version)
  values (
    new.id,
    new.email,
    exists (select 1 from private.beta_invites i where i.email = lower(new.email)),
    wants and confirmed,
    wants and not confirmed,
    case when wants then new.raw_user_meta_data ->> 'consent_text_version' end
  )
  on conflict (id) do nothing;
  perform set_config('app.consent_source', '', true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Opening the sign-in link confirms the address; only then does a ticked
-- box become consent.
create or replace function private.handle_user_confirmed()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform set_config('app.consent_source', 'sign-up, email confirmed', true);
  update public.profiles set marketing_consent = true
   where id = new.id and marketing_consent_pending;
  perform set_config('app.consent_source', '', true);
  return new;
end;
$$;

create or replace trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function private.handle_user_confirmed();

-- --------------------------------------------------------- unsubscribe
-- Called only by the unsubscribe Edge Function (service role). The token is
-- the profile's unsubscribe_token, carried in every marketing email.
create or replace function public.unsubscribe_by_token(p_token uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_email text;
begin
  perform set_config('app.consent_source', 'unsubscribe link', true);
  update public.profiles set marketing_consent = false, marketing_consent_pending = false
   where unsubscribe_token = p_token
  returning email into v_email;
  perform set_config('app.consent_source', '', true);
  if v_email is null then
    return false;
  end if;
  insert into private.marketing_suppressions (email, reason)
  values (lower(v_email), 'unsubscribed')
  on conflict (email) do update set reason = 'unsubscribed', created_at = now();
  return true;
end;
$$;

-- --------------------------------------------------------------- views
-- The only sanctioned export for a marketing send: confirmed, opted in,
-- not on the do-not-email list. Each email must carry its unsubscribe link.
create or replace view private.marketing_list as
select p.email, p.marketing_consent_at, p.consent_text_version, p.unsubscribe_token
  from public.profiles p
  join auth.users u on u.id = p.id
 where p.marketing_consent
   and u.email_confirmed_at is not null
   and not exists (select 1 from private.marketing_suppressions s where s.email = lower(p.email));

-- Accounts with no sign-in for 24 months: warn, then delete (manual for now).
create or replace view private.inactive_accounts as
select u.id, u.email, u.created_at, u.last_sign_in_at
  from auth.users u
 where u.email_confirmed_at is not null
   and coalesce(u.last_sign_in_at, u.created_at) < now() - interval '24 months';

-- ------------------------------------------------------------ clean-up
-- Sign-ups whose link was never opened are deleted after 7 days, daily.
create extension if not exists pg_cron;

create or replace function private.delete_unconfirmed_signups()
returns integer
language sql
security definer set search_path = ''
as $$
  with gone as (
    delete from auth.users
     where email_confirmed_at is null
       and created_at < now() - interval '7 days'
    returning 1
  )
  select count(*)::integer from gone;
$$;

select cron.schedule('delete-unconfirmed-signups', '17 3 * * *', 'select private.delete_unconfirmed_signups()');

-- -------------------------------------------------------------- misc
create or replace function public.touch_profile()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_profile();

-- Functions in the exposed public schema stay out of /rest/v1/rpc (security
-- advisor). Triggers still fire: Postgres checks EXECUTE only when the
-- trigger is created. The intent 063 trigger functions live in the private
-- schema, which the API can't reach. unsubscribe_by_token is for the
-- service role only.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_profile() from public, anon, authenticated;
revoke execute on function public.unsubscribe_by_token(uuid) from public, anon, authenticated;
grant execute on function public.unsubscribe_by_token(uuid) to service_role;
