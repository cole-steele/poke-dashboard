-- Poke Dashboard Supabase schema
-- Run this in the Supabase SQL Editor for a new project, then enable email auth.

create extension if not exists pgcrypto;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pokemon_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, pokemon_name)
);

create table if not exists public.team_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot int not null check (slot >= 0 and slot < 6),
  pokemon_name text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);

create table if not exists public.team_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 80),
  slots text[] not null check (array_length(slots, 1) = 6),
  created_at timestamptz not null default now()
);

create index if not exists bookmarks_user_id_idx
  on public.bookmarks (user_id);

create index if not exists team_slots_user_id_slot_idx
  on public.team_slots (user_id, slot);

create index if not exists team_templates_user_id_created_at_idx
  on public.team_templates (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_team_slots_updated_at on public.team_slots;

create trigger set_team_slots_updated_at
before update on public.team_slots
for each row
execute function public.set_updated_at();

alter table public.bookmarks enable row level security;
alter table public.team_slots enable row level security;
alter table public.team_templates enable row level security;

drop policy if exists "Users can read their bookmarks" on public.bookmarks;
create policy "Users can read their bookmarks"
on public.bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their bookmarks" on public.bookmarks;
create policy "Users can create their bookmarks"
on public.bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their bookmarks" on public.bookmarks;
create policy "Users can delete their bookmarks"
on public.bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their team slots" on public.team_slots;
create policy "Users can read their team slots"
on public.team_slots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their team slots" on public.team_slots;
create policy "Users can create their team slots"
on public.team_slots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their team slots" on public.team_slots;
create policy "Users can update their team slots"
on public.team_slots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their team slots" on public.team_slots;
create policy "Users can delete their team slots"
on public.team_slots
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their team templates" on public.team_templates;
create policy "Users can read their team templates"
on public.team_templates
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their team templates" on public.team_templates;
create policy "Users can create their team templates"
on public.team_templates
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their team templates" on public.team_templates;
create policy "Users can update their team templates"
on public.team_templates
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their team templates" on public.team_templates;
create policy "Users can delete their team templates"
on public.team_templates
for delete
to authenticated
using (auth.uid() = user_id);
