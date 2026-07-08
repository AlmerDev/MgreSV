import SeoLandingPage from "../components/SeoLandingPage";

export const metadata = {
  title: "Instagram Downloader Online - Download Foto, Video & Slide",
  description: "Download foto Instagram, video Instagram, reels, dan slide publik secara online lewat MgreSV.",
  alternates: { canonical: "/instagram-downloader" },
  openGraph: {
    title: "Instagram Downloader Online - Download Foto, Video & Slide",
    description: "Download foto Instagram, video Instagram, reels, dan slide publik secara online lewat MgreSV.",
    url: "/instagram-downloader",
    type: "website",
  },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Instagram Downloader Online"
      subtitle="Gunakan MgreSV untuk download foto Instagram, video Instagram, reels, dan media slide dari postingan publik."
      platform="Instagram"
      features={["Download foto Instagram dari postingan publik.", "Download video Instagram dan reels jika tersedia.", "Mendukung slide/carousel agar bisa diunduh per media.", "Preview foto atau video sebelum memilih download."]}
      steps={["Salin link postingan, reels, atau carousel Instagram publik.", "Tempel link ke kolom downloader MgreSV.", "Tunggu daftar foto/video/slide muncul.", "Download satu per satu atau semua media yang tersedia."]}
      faq={[{"q": "Bisa download slide Instagram?", "a": "Bisa, jika data slide dari postingan publik berhasil dibaca."}, {"q": "Kenapa foto Instagram tidak muncul?", "a": "Biasanya karena link privat, dibatasi, atau respons media dari platform kosong."}, {"q": "Apakah bisa untuk akun private?", "a": "Tidak. Gunakan hanya konten publik yang memang bisa diakses."}]}
    />
  );
}
