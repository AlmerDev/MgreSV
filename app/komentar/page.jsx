import ReviewPage, { metadata as reviewMetadata } from "../review/page";

export const metadata = {
  ...reviewMetadata,
  alternates: {
    canonical: "/review",
  },
};

export default ReviewPage;
