# Search Console Sitemap Hardfix

Versi ini mengubah sitemap dan robots menjadi file statis di folder `public/`.

Perubahan:

- `public/sitemap.xml` ditambahkan sebagai file XML statis.
- `public/robots.txt` ditambahkan sebagai file TXT statis.
- `app/sitemap.js` dihapus agar `/sitemap.xml` tidak memakai route generator Next.js.
- `app/robots.js` dihapus agar `/robots.txt` tidak memakai route generator Next.js.

Setelah deploy ulang ke Vercel, buka:

- https://mgresv.vercel.app/sitemap.xml
- https://mgresv.vercel.app/robots.txt

Lalu di Google Search Console:

1. Masuk menu Peta Situs.
2. Hapus sitemap lama yang error jika tombol hapus tersedia.
3. Submit ulang: `sitemap.xml`.
4. Jika masih merah, tunggu 24 jam. Search Console kadang lambat memperbarui status walaupun file sudah bisa dibuka.

Catatan: `.env.local` tidak disertakan di ZIP ini. Gunakan Environment Variables di Vercel untuk token/secret aplikasi.
