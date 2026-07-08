import SeoLandingPage from "../components/SeoLandingPage";

export const metadata = {
  title: "Download MP3 Online - Convert Video ke MP3",
  description: "Convert video ke MP3 dan download audio online dari link publik menggunakan MgreSV.",
  alternates: { canonical: "/download-mp3" },
  openGraph: {
    title: "Download MP3 Online - Convert Video ke MP3",
    description: "Convert video ke MP3 dan download audio online dari link publik menggunakan MgreSV.",
    url: "/download-mp3",
    type: "website",
  },
};

export default function Page() {
  return (
    <SeoLandingPage
      title="Download MP3 Online"
      subtitle="MgreSV membantu convert video ke audio dan download MP3 online dari link publik yang didukung."
      platform="MP3"
      features={["Convert video ke MP3 online.", "Pilihan kualitas audio seperti 320k, 192k, dan 128k jika tersedia.", "Mendukung format audio lain seperti M4A, AAC, OPUS, WAV, FLAC, dan OGG.", "Tidak perlu install aplikasi tambahan."]}
      steps={["Salin link video publik dari platform yang didukung.", "Tempel link di MgreSV dan tunggu analisis selesai.", "Pilih tab Audio.", "Klik Download pada format MP3 atau audio lain yang tersedia."]}
      faq={[{"q": "Bisa convert YouTube ke MP3?", "a": "Bisa jika link publik berhasil diproses dan format audio tersedia."}, {"q": "Apakah kualitas 320k selalu muncul?", "a": "Tidak. Kualitas audio mengikuti media sumber dan kemampuan proses server."}, {"q": "Apakah bisa download WAV atau FLAC?", "a": "Bisa jika format tersebut tersedia pada hasil analisis."}]}
    />
  );
}
