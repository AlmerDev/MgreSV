import LeaderboardClient from "./LeaderboardClient";

export const metadata = {
  title: "Leaderboard Download",
  description: "Peringkat pengguna paling aktif download di MgreSV.",
  alternates: {
    canonical: "/leaderboard",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
