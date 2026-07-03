# MgreSV Review Upgrade

Added:
- Rating website now supports half-star display, so 4.5 shows 4.5 stars instead of 5 full stars.
- Each account can only create one review per page.
- User can edit their own review.
- User can delete their own review.
- Realtime listener now handles INSERT, UPDATE, and DELETE.

Run this SQL in Supabase:
- web/SUPABASE_REVIEW_EDIT_DELETE_ONE_PER_ACCOUNT_FIX.sql

Important:
- The SQL adds update/delete RLS policies.
- The SQL adds a unique index for one review per user per page.
- The SQL also fixes old `name NOT NULL` column from older review table versions.
