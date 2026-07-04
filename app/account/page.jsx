import AccountClient from "./AccountClient";

export default function AccountPage({ searchParams }) {
  const resetMode = searchParams?.reset === "1";

  return <AccountClient resetMode={resetMode} />;
}
