import "./styles.css"

export const metadata = {
  title: "MgreSV",
  description: "Fast Media Downloader"
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
