const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mgresv.vercel.app").replace(/\/$/, "");

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/files/", "/tmp/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
