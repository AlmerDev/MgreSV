# MgreSV Rating Summary + PlayStore-like Stars

Changed:
- Rating summary card now looks like the reference:
  - big average number
  - stars below the score
  - 5-to-1 distribution bars
  - review count
- Half stars are now rendered with SVG clipping, so 4.5 is visually a true half star.
- Empty stars use gray, not white.

Files changed:
- web/app/review/page.jsx
- web/app/styles.css
