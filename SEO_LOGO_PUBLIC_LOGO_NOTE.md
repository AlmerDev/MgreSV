# SEO Logo Update

Logo Google/Search/Favicon sekarang diarahkan ke file `public/logo.png`.

Perubahan utama:
- `Organization.logo` di JSON-LD memakai `https://mgresv.vercel.app/logo.png`
- Open Graph image memakai `/logo.png`
- Twitter image memakai `/logo.png`
- manifest menyertakan `/logo.png`
- favicon PNG/ICO dibuat ulang dari `public/logo.png`

Setelah deploy, cek:
- https://mgresv.vercel.app/logo.png
- https://mgresv.vercel.app/favicon.ico
- https://mgresv.vercel.app/favicon-48x48.png

Google bisa butuh waktu untuk mengganti favicon/nama situs di hasil pencarian setelah recrawl.
