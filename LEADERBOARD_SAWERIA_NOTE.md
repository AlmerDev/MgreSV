# MgreSV Leaderboard + Saweria Support

Added:
- `/leaderboard`
- Navbar link: Leaderboard
- Leaderboard shows users with the highest download count.
- Credit page has Support Me / Saweria donate section.
- Saweria URL can be edited with:
  NEXT_PUBLIC_SAWERIA_URL=https://saweria.co/username

Supabase:
Run:
- web/SUPABASE_LEADERBOARD_SETUP.sql

How leaderboard works:
- Download events are already recorded in `download_events` when logged-in users download.
- The leaderboard page calls RPC:
  get_download_leaderboard(limit_count)
- This avoids exposing all download event rows publicly.
