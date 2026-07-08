import SiteNav from "../components/SiteNav";
import {
  BadgeCheck,
  DownloadCloud,
  Image,
  Music2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const features = [
  {
    title: "Multi-platform",
    desc: "MgreSV dirancang untuk membantu mengambil media dari berbagai platform seperti TikTok, Instagram, Facebook, X, Pinterest, Reddit, Vimeo, SoundCloud, dan lainnya.",
    icon: Rocket,
  },
  {
    title: "Video, foto, audio",
    desc: "Sistem mendeteksi tipe link agar tampilan download menyesuaikan: video, audio, foto tunggal, maupun carousel/slide.",
    icon: DownloadCloud,
  },
  {
    title: "Audio extraction",
    desc: "Untuk link berbasis video atau musik, sistem menyediakan opsi audio agar file lebih ringan dan fleksibel digunakan.",
    icon: Music2,
  },
  {
    title: "Tampilan sederhana",
    desc: "Antarmuka dibuat langsung ke tujuan: tempel link, convert, pilih format, lalu download.",
    icon: ShieldCheck,
  },
];

export const metadata = {
  title: "Tentang Website",
  description: "Tentang MgreSV dan fitur unggulan website downloader.",
  alternates: {
    canonical: "/tentang",
  },
};

export default function TentangPage() {
  return (
    <main className="page innerPage">
      <SiteNav />

      <section className="innerHero aboutHero">
        <div className="heroBadge">
          <Sparkles size={16} />
          Tentang Website
        </div>
        <h1>
          MgreSV dibuat untuk download media lebih cepat, rapi, dan mudah.
        </h1>
        <p>
          MgreSV adalah website downloader yang membantu pengguna menyimpan
          video, audio, foto, dan slide dari berbagai platform publik hanya
          dengan menempelkan link. Fokusnya sederhana: proses cepat, tampilan
          bersih, dan hasil download yang mudah dipilih.
        </p>
      </section>

      <section className="aboutIntroCard">
        <div>
          <BadgeCheck size={28} />
          <h2>Apa itu MgreSV?</h2>
        </div>
        <p>
          Website ini menggabungkan frontend yang ringan, worker downloader,
          extractor media, dan provider API untuk membaca tipe konten. Dengan
          begitu, link video akan diarahkan ke format video/audio, sedangkan
          link foto atau carousel akan diarahkan ke panel slide/foto.
        </p>
      </section>

      <section className="featureGrid">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article className="featureCard" key={feature.title}>
              <div className="featureIcon">
                <Icon size={24} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
