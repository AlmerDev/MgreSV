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
