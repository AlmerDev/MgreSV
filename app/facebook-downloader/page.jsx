import SeoLandingPage from "../components/SeoLandingPage";

export const metadata = {
  title: "Facebook Downloader Online - Download Video Facebook",
  description: "Download video Facebook online dari link publik lewat MgreSV langsung dari browser.",
  alternates: { canonical: "/facebook-downloader" },
  openGraph: {
    title: "Facebook Downloader Online - Download Video Facebook",
    description: "Download video Facebook online dari link publik lewat MgreSV langsung dari browser.",
    url: "/facebook-downloader",
    type: "website",
  },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Facebook Downloader Online"
      subtitle="MgreSV dapat membantu membaca link Facebook publik dan menyediakan format download video yang tersedia."
      platform="Facebook"
      features={["Download video Facebook dari link publik.", "Pilihan kualitas menyesuaikan media sumber.", "Proses lewat browser tanpa aplikasi tambahan.", "Tampilan responsif untuk HP dan desktop."]}
      steps={["Salin link video Facebook publik.", "Tempel link di halaman utama MgreSV.", "Tunggu proses analisis link selesai.", "Pilih kualitas lalu klik Download."]}
      faq={[{"q": "Apakah video Facebook private bisa diunduh?", "a": "Tidak. MgreSV hanya ditujukan untuk link publik yang dapat diakses."}, {"q": "Kenapa video tidak terbaca?", "a": "Bisa karena link dibatasi, terhapus, atau platform tidak mengirim data media."}, {"q": "Format apa yang tersedia?", "a": "Biasanya MP4 jika link dan sumber media mendukung."}]}
    />
  );
}
