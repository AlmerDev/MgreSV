# MgreSV Instagram Video Not Photo Fix

Problem:
- Instagram video/Reel could appear as photo/slide because extractor returned thumbnails/images.
- Instagram `/p/` was also being forced to photo from the URL, even though `/p/` can be photo, carousel, or video.

Fix:
- Instagram `/reel/`, `/reels/`, `/tv/`, `/share/reel/` are forced to Video + Audio mode.
- Instagram `/p/` is no longer forced to Photo just from URL.
- If provider/extractor says the media is video, photo slides are ignored.
- Instagram photo/carousel still works if extractor returns real photo slides.

Files changed:
- web/app/api/analyze/route.js
