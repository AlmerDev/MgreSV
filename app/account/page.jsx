import AccountClient from "./AccountClient";

export const metadata = {
  title: "Akun",
  description: "Kelola akun MgreSV.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AccountPage({ searchParams }) {
  const resetMode = searchParams?.reset === "1";

  return <AccountClient resetMode={resetMode} />;
}
