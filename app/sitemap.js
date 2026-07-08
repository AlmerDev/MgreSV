const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mgre-sv.vercel.app").replace(/\/$/, "");

const routes = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/tentang", priority: 0.8, changeFrequency: "monthly" },
  { path: "/review", priority: 0.7, changeFrequency: "daily" },
  { path: "/leaderboard", priority: 0.6, changeFrequency: "daily" },
  { path: "/credit", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap() {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
