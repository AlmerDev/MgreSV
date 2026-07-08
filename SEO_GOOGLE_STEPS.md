# SEO Google Setup untuk MgreSV

Patch ini menyiapkan hal teknis agar website lebih mudah dicrawl dan diindeks Google.

## Yang sudah diperbaiki

- `app/layout.jsx`
  - Metadata utama diperjelas.
  - `metadataBase` diarahkan ke `https://mgresv.vercel.app`.
  - Canonical homepage ditambahkan.
  - Open Graph, Twitter card, robots meta, viewport, dan JSON-LD WebApplication ditambahkan.

- `app/robots.js`
  - Robots mengizinkan crawl halaman publik.
  - API dan folder temporary diblok crawl.
  - Sitemap diarahkan ke `https://mgresv.vercel.app/sitemap.xml`.

- `app/sitemap.js`
  - Sitemap hanya memuat URL publik yang benar-benar ada:
    - `/`
    - `/tentang`
    - `/review`
    - `/leaderboard`
    - `/credit`
  - URL lama yang tidak ada dihapus dari sitemap.

- Google verification
  - File `googleab7d0497e887ac4d.html` sudah dicopy ke `public/`, sehingga akan bisa diakses di:
    - `https://mgresv.vercel.app/googleab7d0497e887ac4d.html`

- Page metadata
  - Metadata dan canonical ditambahkan untuk halaman publik.
  - Login, register, account, dan profile diberi `noindex` agar tidak masuk hasil pencarian.

- Redirect
  - `/convert-video-ke-mp3` dan `/download-video-online` diarahkan permanent ke `/` karena sebelumnya ada di sitemap tapi tidak ada halaman aslinya.

## Setelah deploy ke Vercel

1. Pastikan environment variable di Vercel:

```env
NEXT_PUBLIC_SITE_URL=https://mgresv.vercel.app
```

2. Deploy ulang project.

3. Buka URL ini dan pastikan muncul:

```text
https://mgresv.vercel.app/robots.txt
https://mgresv.vercel.app/sitemap.xml
https://mgresv.vercel.app/googleab7d0497e887ac4d.html
```

4. Masuk ke Google Search Console.

5. Tambahkan property dengan tipe URL prefix:

```text
https://mgresv.vercel.app
```

6. Pilih metode verifikasi HTML file, lalu klik Verify. File verifikasi sudah berada di `public/`.

7. Buka menu Sitemaps, submit:

```text
sitemap.xml
```

8. Buka URL Inspection, masukkan:

```text
https://mgresv.vercel.app/
```

Lalu pilih Request indexing.

## Catatan penting

Masuk Google Search tidak instan. Sitemap hanya membantu Google menemukan URL; Google tetap yang menentukan kapan dan apakah halaman akan diindeks. Untuk peluang ranking yang lebih baik, tambahkan konten teks unik di homepage seperti cara penggunaan, fitur, FAQ, dan batasan penggunaan.
