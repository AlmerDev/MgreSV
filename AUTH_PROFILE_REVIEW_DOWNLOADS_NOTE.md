# MgreSV Auth + Profile + Review + Download Counter

Added:
- `/login`
- `/register`
- `/account`
- `/profile` alias
- Review requires login
- Review name uses account username
- Edit profile: username, display name, avatar upload
- Reset/change password
- Profile preview: avatar, username, email, total download count
- Download events are recorded when logged-in users successfully download

Supabase setup:
1. Put these ENV in web:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

2. Run SQL:
   web/SUPABASE_AUTH_REVIEW_PROFILE_SETUP.sql

3. In Supabase Auth:
   - Enable Email provider
   - Set Site URL to your website domain
   - Add Redirect URLs:
     https://your-domain.com/account?reset=1
     http://localhost:3000/account?reset=1

4. Storage:
   SQL creates public bucket `avatars`.
   If bucket creation fails, create bucket manually:
   Storage > New bucket > avatars > Public.

5. Realtime:
   Enable realtime for table `reviews`.


Username-only update:
- Nama tampilan removed from UI.
- Username now preserves spaces and uppercase/lowercase.
