import type { Metadata } from "next";

import { SuccessScreen } from "@/components/public/success-screen";
import { MESSAGES } from "@/lib/constants";

export const metadata: Metadata = { title: "Thank you for contributing" };

export default function ContributeThankYouPage() {
  return <SuccessScreen title="Contribution received" message={MESSAGES.submissionReceived} />;
}
