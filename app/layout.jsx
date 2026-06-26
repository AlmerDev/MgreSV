import "./styles.css";

export const metadata = {
  title: "MgreSV",
  description:
    "Simpan konten dari YouTube, TikTok, Instagram, dan platform lainnya dalam hitungan detik. Cukup tempel link dan unduh sekarang!",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
