import SeoLandingPage from "../components/SeoLandingPage";

export const metadata = {
  title: "Download Video Online - MP4 Downloader Gratis",
  description: "Download video online dari berbagai platform publik dengan pilihan format MP4 dan kualitas yang tersedia di MgreSV.",
  alternates: { canonical: "/download-video" },
  openGraph: {
    title: "Download Video Online - MP4 Downloader Gratis",
    description: "Download video online dari berbagai platform publik dengan pilihan format MP4 dan kualitas yang tersedia di MgreSV.",
    url: "/download-video",
    type: "website",
  },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Download Video Online"
      subtitle="MgreSV adalah downloader video online untuk link publik dari beberapa platform populer dengan pilihan kualitas yang tersedia."
      platform="video online"
      features={["Download video online dari browser.", "Mendukung beberapa platform publik populer.", "Pilihan kualitas video seperti 1080p, 720p, 480p, dan 360p jika tersedia.", "Cocok untuk pengguna HP dan desktop."]}
      steps={["Salin URL video publik.", "Tempel URL ke kolom downloader MgreSV.", "Pilih tab Video setelah analisis selesai.", "Klik Download pada kualitas yang diinginkan."]}
      faq={[{"q": "Platform apa saja yang didukung?", "a": "MgreSV menargetkan YouTube, TikTok, Instagram, Facebook, X, Threads, Pinterest, dan beberapa link publik lain."}, {"q": "Apakah kualitas 1080p selalu tersedia?", "a": "Tidak. Kualitas mengikuti media sumber dan hasil proses server."}, {"q": "Apakah gratis?", "a": "Halaman ini disediakan sebagai tool online gratis untuk penggunaan wajar."}]}
    />
  );
}
