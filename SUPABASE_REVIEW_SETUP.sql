-- Supabase SQL for MgreSV realtime review page

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null default 'mgresv-home',
  name text not null,
  body text not null,
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews
for select
to anon
using (status = 'approved');

drop policy if exists "Public can insert reviews" on public.reviews;
create policy "Public can insert reviews"
on public.reviews
for insert
to anon
with check (
  status = 'approved'
  and char_length(name) <= 40
  and char_length(body) <= 500
  and rating >= 1
  and rating <= 5
);

-- Realtime:
-- Supabase Dashboard -> Database -> Replication -> enable realtime for table reviews
