-- MgreSV Auth + Profile + Realtime Review + Download Counter Setup
-- Run this in Supabase SQL Editor.
-- Enable Realtime for table `reviews`.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are public readable" on public.profiles;
create policy "Profiles are public readable"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null default 'mgresv-home',
  user_id uuid references auth.users(id) on delete set null,
  username text not null,
  avatar_url text,
  body text not null,
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

alter table public.reviews add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.reviews add column if not exists username text;
alter table public.reviews add column if not exists avatar_url text;
alter table public.reviews add column if not exists page_slug text not null default 'mgresv-home';
alter table public.reviews add column if not exists status text not null default 'approved';

update public.reviews
set username = coalesce(username, name, 'Guest')
where username is null;

alter table public.reviews alter column username set not null;

alter table public.reviews enable row level security;

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Authenticated users can insert own reviews" on public.reviews;
create policy "Authenticated users can insert own reviews"
on public.reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'approved'
  and char_length(username) <= 40
  and char_length(body) <= 500
  and rating >= 1
  and rating <= 5
);

create table if not exists public.download_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text,
  platform text,
  media_group text,
  file_type text,
  created_at timestamptz not null default now()
);

alter table public.download_events enable row level security;

drop policy if exists "Users can insert own download events" on public.download_events;
create policy "Users can insert own download events"
on public.download_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own download events" on public.download_events;
create policy "Users can read own download events"
on public.download_events
for select
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatars" on storage.objects;
create policy "Users can upload own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

do $$
begin
  alter publication supabase_realtime add table public.reviews;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;


-- ===== Review edit/delete + one review per account fix =====
-- Run this after the existing setup if your reviews table already existed.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reviews'
      and column_name = 'name'
  ) then
    alter table public.reviews alter column name drop not null;
    alter table public.reviews alter column name set default 'Guest';
  end if;
end $$;

alter table public.reviews add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.reviews add column if not exists username text;
alter table public.reviews add column if not exists avatar_url text;
alter table public.reviews add column if not exists page_slug text not null default 'mgresv-home';
alter table public.reviews add column if not exists status text not null default 'approved';

update public.reviews
set username = coalesce(username, name, 'Guest')
where username is null;

alter table public.reviews alter column username set not null;

-- Keep only the newest review if an account accidentally has duplicates.
delete from public.reviews old_review
using public.reviews new_review
where old_review.user_id is not null
  and new_review.user_id is not null
  and old_review.page_slug = new_review.page_slug
  and old_review.user_id = new_review.user_id
  and old_review.created_at < new_review.created_at;

create unique index if not exists reviews_one_review_per_user_per_page
on public.reviews (page_slug, user_id)
where user_id is not null;

drop policy if exists "Authenticated users can insert own reviews" on public.reviews;
create policy "Authenticated users can insert own reviews"
on public.reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'approved'
  and char_length(username) <= 40
  and char_length(body) <= 500
  and rating >= 1
  and rating <= 5
);

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
on public.reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and status = 'approved'
  and char_length(username) <= 40
  and char_length(body) <= 500
  and rating >= 1
  and rating <= 5
);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
on public.reviews
for delete
to authenticated
using (auth.uid() = user_id);


-- ===== Username-only UI note =====
-- The website no longer uses display_name in the UI.
-- Column display_name may stay in database safely for backward compatibility.
-- Username is free text: spaces and uppercase/lowercase are allowed by default because it is a normal text column.


-- MgreSV Leaderboard Setup
-- Run this in Supabase SQL Editor.
-- This creates a safe public RPC for leaderboard counts without exposing all download event rows.

create or replace function public.get_download_leaderboard(limit_count int default 50)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  total_downloads bigint
)
language sql
security definer
set search_path = public
as $$
  select
    de.user_id,
    coalesce(p.username, 'Unknown User') as username,
    p.avatar_url,
    count(de.id)::bigint as total_downloads
  from public.download_events de
  left join public.profiles p on p.id = de.user_id
  group by de.user_id, p.username, p.avatar_url
  order by count(de.id) desc, coalesce(p.username, 'Unknown User') asc
  limit greatest(1, least(coalesce(limit_count, 50), 100));
$$;

grant execute on function public.get_download_leaderboard(int) to anon, authenticated;
