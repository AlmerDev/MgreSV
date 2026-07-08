import SiteNav from "../components/SiteNav";
import {
  Code2,
  Coffee,
  ExternalLink,
  HeartHandshake,
  Mail,
  Palette,
  Sparkles,
  UserRound,
} from "lucide-react";

const SAWERIA_URL =
  process.env.NEXT_PUBLIC_SAWERIA_URL || "https://saweria.co/almerdev";

const creators = [
  {
    name: "AlmerDev",
    role: "Developer",
    job: "Mengembangkan sistem, coding frontend-backend, API route, worker, extractor, integrasi provider, serta struktur teknis MgreSV.",
    email: "d.almerzaky@gmail.com",
    avatar: "/creators/almerdev.png",
    avatarFallback: "AD",
    icon: Code2,
  },
  {
    name: "Ciyan",
    role: "Web Design",
    job: "Membantu arah visual website, tampilan antarmuka, layout, pemilihan gaya desain, dan pengalaman pengguna agar MgreSV terlihat lebih rapi.",
    email: "ciyantik9@gmail.com",
    avatar: "/creators/ciyan.png",
    avatarFallback: "CY",
    icon: Palette,
  },
];

export const metadata = {
  title: "Credit",
  description: "Pembuat website MgreSV.",
  alternates: {
    canonical: "/credit",
  },
};

export default function CreditPage() {
  return (
    <main className="page innerPage">
      <SiteNav />

      <section className="innerHero creditHero">
        <div className="heroBadge">
          <Sparkles size={16} />
          Credit
        </div>
        <h1>Orang di balik MgreSV.</h1>
        <p>
          Website ini dibuat oleh AlmerDev dan Ciyan. AlmerDev menangani sisi
          pengembangan dan coding, sedangkan Ciyan membantu arah visual dan
          desain tampilan website.
        </p>
      </section>

      <section className="creatorGrid">
        {creators.map((creator) => {
          const Icon = creator.icon;

          return (
            <article className="creatorCard" key={creator.name}>
              <div className="creatorTop">
                <div className="creatorAvatar">
                  {creator.avatar ? (
                    <img src={creator.avatar} alt={creator.name} />
                  ) : (
                    <span>{creator.avatarFallback}</span>
                  )}
                </div>
                <div className="creatorRole">
                  <Icon size={18} />
                  {creator.role}
                </div>
              </div>

              <h2>{creator.name}</h2>
              <p>{creator.job}</p>

              <div className="creatorMeta">
                <div>
                  <UserRound size={16} />
                  Profile: {creator.name}
                </div>
                <a href={`mailto:${creator.email}`}>
                  <Mail size={16} />
                  {creator.email}
                </a>
              </div>
            </article>
          );
        })}
      </section>

      <section className="supportMeCard">
        <div className="supportMeIcon">
          <HeartHandshake size={30} />
        </div>

        <div>
          <span className="supportEyebrow">Support Me</span>
          <h2>Dukung pengembangan MgreSV lewat Saweria.</h2>
          <p>
            Kalau website ini membantu, kamu bisa support AlmerDev dan Ciyan
            agar MgreSV bisa terus dikembangkan, diperbaiki, dan ditambah fitur
            baru.
          </p>
        </div>

        <a
          href={SAWERIA_URL}
          target="_blank"
          rel="noreferrer"
          className="saweriaButton"
        >
          <Coffee size={18} />
          Donate di Saweria
          <ExternalLink size={16} />
        </a>
      </section>
    </main>
  );
}
