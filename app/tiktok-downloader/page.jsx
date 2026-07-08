import SeoLandingPage from "../components/SeoLandingPage";

export const metadata = {
  title: "TikTok Downloader Online - Download Video TikTok",
  description: "Download video TikTok online lewat MgreSV dengan proses cepat dari browser untuk link publik.",
  alternates: { canonical: "/tiktok-downloader" },
  openGraph: {
    title: "TikTok Downloader Online - Download Video TikTok",
    description: "Download video TikTok online lewat MgreSV dengan proses cepat dari browser untuk link publik.",
    url: "/tiktok-downloader",
    type: "website",
  },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="TikTok Downloader Online"
      subtitle="MgreSV membantu download video TikTok online dan menyimpan media publik dalam format yang tersedia."
      platform="TikTok"
      features={["Download video TikTok dari link publik.", "Mendukung preview media sebelum download.", "Pilihan format mengikuti hasil analisis link.", "Dapat digunakan di HP dan desktop."]}
      steps={["Salin link TikTok publik.", "Tempel link di downloader MgreSV.", "Tunggu MgreSV membaca media dari link tersebut.", "Pilih format lalu klik Download."]}
      faq={[{"q": "Apakah bisa download video TikTok di HP?", "a": "Bisa. Buka MgreSV lewat browser HP, tempel link, lalu pilih format download."}, {"q": "Apakah semua link TikTok bisa diproses?", "a": "Tidak selalu. Link privat, terhapus, atau dibatasi platform mungkin tidak tersedia."}, {"q": "Apakah MgreSV menyimpan file pengguna?", "a": "MgreSV dirancang sebagai alat proses link; gunakan hanya untuk konten yang boleh kamu unduh."}]}
    />
  );
}
