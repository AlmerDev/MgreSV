import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "Register",
  description: "Buat akun MgreSV.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
