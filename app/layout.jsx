import "./styles.css";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mgre-sv.vercel.app").replace(/\/$/, "");
const SITE_NAME = "MgreSV";
const SITE_DESCRIPTION =
  "MgreSV adalah tool online untuk download video, audio, foto, dan slide dari YouTube, TikTok, Instagram, Facebook, X, Threads, Pinterest, dan platform publik lainnya.";

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ["MgreSV Downloader", "MgreSV Media Downloader", "MGRE SV"],
      url: `${SITE_URL}/`,
      inLanguage: "id-ID",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?url={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo.png`,
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      alternateName: "MgreSV Fast Media Downloader",
      url: `${SITE_URL}/`,
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
    },
  ],
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "MgreSV | Download Video, Audio & Foto Online",
    template: "%s | MgreSV",
  },
  description: SITE_DESCRIPTION,
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
  publisher: SITE_NAME,
  category: "technology",
  manifest: "/site.webmanifest",
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", sizes: "728x728", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/logo.png", sizes: "728x728", type: "image/png" }],
  },
  openGraph: {
    title: "MgreSV | Download Video, Audio & Foto Online",
    description:
      "Fast media downloader untuk video, audio, foto, dan slide dari berbagai platform publik.",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    type: "website",
    locale: "id_ID",
    images: [
      {
        url: "/logo.png",
        width: 728,
        height: 728,
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
