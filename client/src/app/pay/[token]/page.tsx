import type { Metadata } from "next";
import { InternshipDocumentCheckout } from "@/components/payments/InternshipDocumentCheckout";
import "@/styles/internship-payment-checkout.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Internship Document Payment | ZOBHUNGER",
  description: "Secure payment for approved internship document printing and courier charges.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function InternshipPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InternshipDocumentCheckout token={token} />;
}
