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
