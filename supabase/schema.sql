-- Profiles table: maps auth users to app-level usernames
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

-- Automatically create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Contacts table: shared list across all authenticated users
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  org text,
  phone text not null,
  email text,
  tags text[],
  created_at timestamptz not null default now(),
  last_engaged_at timestamptz,
  last_engaged_by uuid references public.profiles(id),
  notes_summary text
);

-- Interactions table: per-contact activity log
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('call', 'whatsapp', 'note')),
  note text,
  created_at timestamptz not null default now()
);

-- Indexes for calling mode ordering and queries
create index if not exists contacts_created_at_idx
  on public.contacts (created_at desc);

create index if not exists contacts_last_engaged_at_idx
  on public.contacts (last_engaged_at asc nulls first);

create index if not exists interactions_contact_id_created_at_idx
  on public.interactions (contact_id, created_at desc);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;

-- RLS policies: shared list but authenticated-only access

-- Profiles: each user can see and update only their row
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Contacts: all authenticated users can see all contacts; only authenticated can modify
drop policy if exists "All authenticated users can read contacts" on public.contacts;
create policy "All authenticated users can read contacts"
  on public.contacts
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert contacts" on public.contacts;
create policy "Authenticated users can insert contacts"
  on public.contacts
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update contacts" on public.contacts;
create policy "Authenticated users can update contacts"
  on public.contacts
  for update
  using (auth.role() = 'authenticated');

-- Interactions: all authenticated users can read; only owner can modify their own interactions
drop policy if exists "All authenticated users can read interactions" on public.interactions;
create policy "All authenticated users can read interactions"
  on public.interactions
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert own interactions" on public.interactions;
create policy "Users can insert own interactions"
  on public.interactions
  for insert
  with check (auth.uid() = user_id and auth.role() = 'authenticated');

drop policy if exists "Users can update own interactions" on public.interactions;
create policy "Users can update own interactions"
  on public.interactions
  for update
  using (auth.uid() = user_id and auth.role() = 'authenticated');


