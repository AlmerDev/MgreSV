import "./styles.css";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mgre-sv.vercel.app"
).replace(/\/$/, "");

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "MgreSV",
  alternateName: "MgreSV Fast Media Downloader",
  url: SITE_URL,
  description:
    "Tool online untuk download dan convert video, audio, foto, dan slide dari berbagai platform publik langsung dari browser.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  inLanguage: "id-ID",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MgreSV | Download Video, Audio & Foto Online",
    template: "%s | MgreSV",
  },
  description:
    "MgreSV adalah tool online untuk download video, audio, foto, dan slide dari YouTube, TikTok, Instagram, Facebook, X, Threads, Pinterest, dan platform publik lainnya.",
  keywords: [
    "MgreSV",
    "mgresv",
    "download video online",
    "download video tiktok",
    "download video instagram",
    "download video facebook",
    "youtube downloader",
    "tiktok downloader",
    "instagram downloader",
    "facebook downloader",
    "convert video ke mp3",
    "convert video ke mp4",
    "download mp3 dari video",
    "download foto instagram",
    "download slide instagram",
  ],
  authors: [{ name: "AlmerDev" }, { name: "Ciyan" }],
  creator: "AlmerDev",
  publisher: "MgreSV",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
    apple: "/logo.png",
  },
  openGraph: {
    title: "MgreSV | Download Video, Audio & Foto Online",
    description:
      "Fast media downloader untuk video, audio, foto, dan slide dari berbagai platform publik.",
    url: SITE_URL,
    siteName: "MgreSV",
    type: "website",
    locale: "id_ID",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "MgreSV Fast Media Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MgreSV | Download Video, Audio & Foto Online",
    description:
      "Tool online untuk download video, audio, foto, dan slide langsung dari browser.",
    images: ["/logo.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </body>
    </html>
  );
}
