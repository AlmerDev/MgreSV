import Link from "next/link";

const RELATED_LINKS = [
  { href: "/youtube-downloader", label: "YouTube Downloader" },
  { href: "/tiktok-downloader", label: "TikTok Downloader" },
  { href: "/instagram-downloader", label: "Instagram Downloader" },
  { href: "/facebook-downloader", label: "Facebook Downloader" },
  { href: "/download-video", label: "Download Video Online" },
  { href: "/download-mp3", label: "Download MP3 Online" },
];

export default function SeoLandingPage({
  title,
  subtitle,
  platform,
  features = [],
  steps = [],
  faq = [],
}) {
  return (
    <main className="seoPage">
      <section className="seoHero">
        <Link className="seoBack" href="/">
          ← Kembali ke MgreSV
        </Link>
        <p className="seoEyebrow">MgreSV Media Downloader</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <Link className="seoCta" href="/">
          Buka Downloader
        </Link>
      </section>

      <section className="seoGrid">
        <article className="seoCard">
          <h2>Fitur utama {platform}</h2>
          <ul>
            {features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="seoCard">
          <h2>Cara menggunakan</h2>
          <ol>
            {steps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </section>

      <section className="seoCard seoFaq">
        <h2>Pertanyaan umum</h2>
        {faq.map((item) => (
          <div key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>

      <section className="seoCard seoLinks">
        <h2>Halaman terkait</h2>
        <div>
          {RELATED_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
