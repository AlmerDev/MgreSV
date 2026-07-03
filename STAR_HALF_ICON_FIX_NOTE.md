# MgreSV Star Half Icon Fix

Changed:
- Rating stars no longer use clipping/masking.
- Rating stars now use actual FontAwesome-style icons:
  - FaStar for full star
  - FaStarHalfAlt for half star
  - FaRegStar for empty star
- Empty stars are gray.
- Half star now looks like a real `fa-star-half` icon.

Files changed:
- web/app/review/page.jsx
- web/app/styles.css
- web/package.json
