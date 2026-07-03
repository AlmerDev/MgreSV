# MenGinaSV Web

Deploy folder ini ke Vercel.

ENV:

```env
DOWNLOADER_WORKER_URL=https://domain-worker-kamu.koyeb.app/api/download
DOWNLOADER_WORKER_TOKEN=token-yang-sama
```


## Catatan TikTok photo/slide

Web v4 menolak URL halaman sosial sebagai preview gambar. Jadi kalau extractor/worker cuma mengembalikan `https://www.tiktok.com/@.../photo/...`, UI tidak akan menampilkan broken slide palsu lagi.

Untuk hasil TikTok photo/slide paling stabil, aktifkan `APIFY_TOKEN` di service `extractor`, bukan di web.
