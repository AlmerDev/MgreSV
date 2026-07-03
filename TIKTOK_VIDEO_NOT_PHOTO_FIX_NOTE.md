# MgreSV TikTok Video Not Photo Fix

Problem:
- Some TikTok `/video/` links were detected as photo/slide because the extractor returned image thumbnails/slides.
- Result: video link showed "4 slide/media" and photo download UI.

Fix:
- TikTok `/video/` is now forced into video mode.
- TikTok `/photo/` still stays photo/slide mode.
- Forced video links clear extractor photo slides from the UI.
- Video links show Video + Audio tabs.

Files changed:
- web/app/api/analyze/route.js
