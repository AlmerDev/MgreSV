const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/convert-video-ke-mp3",
        destination: "/",
        permanent: true,
      },
      {
        source: "/download-video-online",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
