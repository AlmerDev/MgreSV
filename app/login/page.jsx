import LoginClient from "./LoginClient";

export default function LoginPage({ searchParams }) {
  const redirectTo = searchParams?.redirect || "/account";

  return <LoginClient redirectTo={redirectTo} />;
}
