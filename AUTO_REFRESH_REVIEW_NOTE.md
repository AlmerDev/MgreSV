# MgreSV Auto Refresh Review

Added:
- Review page auto refresh every 8 seconds.
- Review page refreshes when the browser tab becomes active again.
- Review page refreshes on window focus.
- Supabase realtime listener still works for instant insert/update/delete.
- Manual Refresh button added in rating summary card.
- This does not hard-reload the full page, so the UI will not flicker or lose scroll.

Files changed:
- web/app/review/page.jsx
- web/app/styles.css
