import type { Metadata } from "next";

import { SuccessScreen } from "@/components/public/success-screen";
import { MESSAGES } from "@/lib/constants";
import { shortId } from "@/lib/utils";

export const metadata: Metadata = { title: "Change request submitted" };

export default async function ChangeRequestThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;
  const reference = ref && /^[0-9a-f-]{36}$/i.test(ref) ? ` Your reference number is ${shortId(ref)}.` : "";

  return (
    <SuccessScreen
      title="Change request submitted"
      message={`${MESSAGES.changeRequestReceived}${reference}`}
      primary={{ href: `/products/${id}`, label: "Back to product" }}
      secondary={{ href: "/products", label: "Explore Products" }}
    />
  );
}
