# Sitemap HTML Hotfix

File yang ditambahkan:

- `public/sitemap.html` — halaman sitemap yang bisa dibuka manusia/crawler di `/sitemap.html`.
- `public/sitemap.txt` — sitemap format teks yang bisa disubmit ke Google Search Console sebagai cadangan.
- `public/robots.txt` — dibersihkan dan menunjuk ke `sitemap.xml` serta `sitemap.txt`.

Catatan penting:

- Jangan submit `sitemap.html` di menu **Peta Situs** Google Search Console. HTML sitemap berguna sebagai halaman daftar link, tetapi laporan sitemap Google biasanya membaca XML, TXT, RSS, atau Atom.
- Submit `sitemap.txt` jika `sitemap.xml` masih berstatus "Tidak dapat membaca peta situs".
- Setelah deploy, cek:
  - `https://mgresv.vercel.app/sitemap.html`
  - `https://mgresv.vercel.app/sitemap.txt`
  - `https://mgresv.vercel.app/sitemap.xml`
  - `https://mgresv.vercel.app/robots.txt`
