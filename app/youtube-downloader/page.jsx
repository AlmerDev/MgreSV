import SeoLandingPage from "../components/SeoLandingPage";

export const metadata = {
  title: "YouTube Downloader Online - Download Video & MP3",
  description: "Download video YouTube dan convert YouTube ke MP3 atau MP4 online lewat MgreSV langsung dari browser.",
  alternates: { canonical: "/youtube-downloader" },
  openGraph: {
    title: "YouTube Downloader Online - Download Video & MP3",
    description: "Download video YouTube dan convert YouTube ke MP3 atau MP4 online lewat MgreSV langsung dari browser.",
    url: "/youtube-downloader",
    type: "website",
  },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="YouTube Downloader Online"
      subtitle="Gunakan MgreSV untuk download video YouTube online, menyimpan audio MP3, atau memilih format video MP4 yang tersedia."
      platform="YouTube"
      features={["Download video YouTube online dalam format MP4.", "Convert YouTube ke MP3 untuk menyimpan audio.", "Pilihan kualitas video dan audio menyesuaikan link sumber.", "Tidak perlu install aplikasi tambahan."]}
      steps={["Salin link video YouTube publik yang ingin diproses.", "Buka halaman utama MgreSV dan tempel link ke kolom downloader.", "Pilih format audio atau video yang tersedia.", "Klik Download dan tunggu proses selesai."]}
      faq={[{"q": "Bisa download YouTube ke MP3?", "a": "Bisa, selama link publik dapat diproses oleh server dan format audio tersedia."}, {"q": "Apakah perlu login?", "a": "Tidak. Proses download dilakukan langsung lewat browser tanpa akun."}, {"q": "Kenapa format tertentu tidak muncul?", "a": "Format mengikuti data yang tersedia dari link sumber dan hasil analisis server."}]}
    />
  );
}
