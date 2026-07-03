import "./styles.css";

export const metadata = {
  title: {
    default: "MgreSV",
    template: "%s | MgreSV",
  },
  description: "Download video, audio, foto, dan slide dari berbagai platform dengan cepat.",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "MgreSV",
    description: "Fast Media Downloader untuk video, audio, foto, dan slide.",
    siteName: "MgreSV",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "MgreSV",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
