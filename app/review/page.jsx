import ReviewClient from "./ReviewClient";

export const metadata = {
  title: "Review Pengguna",
  description: "Lihat dan tulis review pengguna untuk MgreSV.",
  alternates: {
    canonical: "/review",
  },
};

export default function ReviewPage() {
  return <ReviewClient />;
}
