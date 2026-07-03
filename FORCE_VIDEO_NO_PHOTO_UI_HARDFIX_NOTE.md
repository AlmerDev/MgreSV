# MgreSV Force Video No Photo UI Hardfix

Problem:
- Some Instagram Reels/videos still showed Foto tab and slide panel because extractor returned thumbnails/images.
- Even if the note said video, UI still displayed photo slides.

Fix:
- Any media classified as `linkKind: "video"` or `suggestedGroup: "video"` now removes Foto tab.
- Video mode clears slides in API response.
- Frontend also ignores slides when `linkKind` or `suggestedGroup` is video.
- Active tab is forced to Video for video mode.

Files changed:
- web/app/api/analyze/route.js
- web/app/page.jsx
