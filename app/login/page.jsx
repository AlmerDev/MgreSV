import LoginClient from "./LoginClient";

export const metadata = {
  title: "Login",
  description: "Login ke akun MgreSV.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginPage({ searchParams }) {
  const redirectTo = searchParams?.redirect || "/account";

  return <LoginClient redirectTo={redirectTo} />;
}
