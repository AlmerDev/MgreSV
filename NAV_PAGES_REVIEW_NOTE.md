# MgreSV Nav Pages + Realtime Review

Added pages:
- `/` and `/download` = downloader
- `/tentang` = Tentang Website
- `/credit` = creator credit cards
- `/review` and `/komentar` = realtime review/comment page

Supabase:
1. Install dependency:
   npm install
2. Add ENV:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
3. Run SQL:
   web/SUPABASE_REVIEW_SETUP.sql
4. Enable Supabase Realtime for table `reviews`.

Note:
- Email in Credit page is placeholder. Edit:
  web/app/credit/page.jsx
