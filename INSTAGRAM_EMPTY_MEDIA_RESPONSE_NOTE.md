# Instagram empty media response

If Worker returns:

`Instagram sent an empty media response`

it means yt-dlp could not access the actual Instagram media without authentication.

Fix options:
- Use a public IG link that opens in incognito without login.
- Configure Worker cookies:
  - YTDLP_COOKIES_B64
  - or YTDLP_COOKIES
- See:
  worker/INSTAGRAM_COOKIES_SETUP.md

This patch adds cookie support to:
- worker/src/server.js
